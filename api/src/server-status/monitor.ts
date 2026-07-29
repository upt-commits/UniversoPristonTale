import { execFile } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import net from 'net';
import path from 'path';
import { promisify } from 'util';
import { getGameConnection, getPortalConnection } from '../db';
import { STATUS_PRESENTATION, decideState } from './state-machine';
import { Operation, PublicServerStatus, ReadinessCheck, ServerState, Telemetry } from './types';

const execFileAsync = promisify(execFile);
const intervalMs = boundedNumber('STATUS_COLLECT_INTERVAL_MS', 7_500, 5_000, 60_000);
const dependencyTimeoutMs = boundedNumber('STATUS_DEPENDENCY_TIMEOUT_MS', 5_000, 250, 10_000);
const maxAgeMs = boundedNumber('STATUS_MAX_AGE_MS', 45_000, 10_000, 300_000);
const heartbeatMaxAgeMs = boundedNumber('STATUS_HEARTBEAT_MAX_AGE_MS', 30_000, 5_000, 300_000);
const successThreshold = boundedNumber('STATUS_SUCCESS_THRESHOLD', 2, 1, 10);
const failureThreshold = boundedNumber('STATUS_FAILURE_THRESHOLD', 2, 1, 10);
const stateFile = process.env.STATUS_STATE_FILE || path.join(process.cwd(), 'data', 'server-status-state.json');

let timer: NodeJS.Timeout | null = null;
let collecting = false;
let telemetry: Telemetry | null = null;
let publicStatus: PublicServerStatus = makePublic('unknown', new Date().toISOString(), new Date().toISOString(), true);
let lastState: ServerState = 'unknown';
let lastStateChangeAt = publicStatus.lastStateChangeAt;
let consecutiveHealthy = 0;
let pendingFailure: ServerState | null = null;
let consecutiveFailures = 0;
const seenNonces = new Map<string, number>();

function boundedNumber(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

async function withTimeout<T>(task: Promise<T>, fallback: T): Promise<T> {
  let handle: NodeJS.Timeout;
  return Promise.race([task, new Promise<T>((resolve) => { handle = setTimeout(() => resolve(fallback), dependencyTimeoutMs); })])
    .finally(() => clearTimeout(handle!));
}

async function withTimeoutReject<T>(task: Promise<T>): Promise<T> {
  let handle: NodeJS.Timeout;
  return Promise.race([task, new Promise<T>((_resolve, reject) => { handle = setTimeout(() => reject(new Error('dependency-timeout')), dependencyTimeoutMs); })])
    .finally(() => clearTimeout(handle!));
}

async function processMatches(expectedPath: string | undefined): Promise<boolean> {
  if (!expectedPath || process.platform !== 'win32') return false;
  const escaped = expectedPath.replace(/'/g, "''");
  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `$p='${escaped}'; [bool](Get-Process -Name Server -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $p } | Select-Object -First 1)`,
    ], { timeout: dependencyTimeoutMs, windowsHide: true, maxBuffer: 4096 });
    return stdout.trim().toLowerCase() === 'true';
  } catch { return false; }
}

function socketReady(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const socket = net.createConnection({ host, port });
    const finish = (value: boolean) => { if (settled) return; settled = true; socket.destroy(); resolve(value); };
    socket.setTimeout(dependencyTimeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function heartbeatReady(logPath: string | undefined): Promise<boolean> {
  if (!logPath) return false;
  try { return Date.now() - (await fs.stat(logPath)).mtimeMs <= heartbeatMaxAgeMs; } catch { return false; }
}

async function serverCheck(exe: string | undefined, log: string | undefined, host: string, port: number): Promise<ReadinessCheck> {
  const [processOk, socketOk, heartbeatOk] = await Promise.all([
    withTimeout(processMatches(exe), false), withTimeout(socketReady(host, port), false), withTimeout(heartbeatReady(log), false),
  ]);
  return { process: processOk, socket: socketOk, heartbeat: heartbeatOk, ready: processOk && socketOk && heartbeatOk };
}

async function databaseCheck(): Promise<{ ready: boolean; degraded: boolean }> {
  const started = Date.now();
  try {
    await withTimeoutReject(Promise.all([
      getGameConnection().then((pool) => pool.request().query('SELECT 1 AS ready')),
      getPortalConnection().then((pool) => pool.request().query('SELECT 1 AS ready')),
    ]));
    return { ready: true, degraded: Date.now() - started > dependencyTimeoutMs * 0.8 };
  } catch { return { ready: false, degraded: false }; }
}

type ControlFile = { maintenance?: { active: boolean; title?: string; message?: string; startedAt?: string; expectedEndAt?: string }; operation?: Operation };

async function readControl(): Promise<{ maintenance: boolean; operation: Operation | null; maintenanceMessage?: string }> {
  try {
    const parsed = JSON.parse(await fs.readFile(stateFile, 'utf8')) as ControlFile;
    return { maintenance: parsed.maintenance?.active === true, operation: parsed.operation || null, maintenanceMessage: parsed.maintenance?.message };
  } catch { return { maintenance: false, operation: null }; }
}

async function writeControl(update: (current: ControlFile) => ControlFile): Promise<void> {
  let current: ControlFile = {};
  try { current = JSON.parse(await fs.readFile(stateFile, 'utf8')) as ControlFile; } catch { /* first write */ }
  const next = update(current);
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  const temporary = `${stateFile}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(next), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporary, stateFile);
}

export async function setMaintenance(active: boolean, details: { title?: string; message?: string; expectedEndAt?: string } = {}): Promise<void> {
  const clean = (value: string | undefined, max: number) => value?.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
  await writeControl((current) => ({ ...current, maintenance: { active, title: clean(details.title, 80), message: clean(details.message, 160), expectedEndAt: details.expectedEndAt, startedAt: active ? new Date().toISOString() : current.maintenance?.startedAt } }));
  await collectNow();
}

// Called only by a successful, authenticated manager start/restart action.
export async function recordOperation(operation: Operation): Promise<void> {
  if (!operation.operationId || new Date(operation.deadlineAt) <= new Date(operation.startedAt)) throw new Error('invalid-operation');
  await writeControl((current) => ({ ...current, operation }));
  await collectNow();
}

function makePublic(state: ServerState, checkedAt: string, changedAt: string, stale: boolean): PublicServerStatus {
  const present = STATUS_PRESENTATION[state];
  return { schemaVersion: 1, world: 'UPT — Temporada 1', state, label: present.label, message: present.message, checkedAt, lastStateChangeAt: changedAt, stale };
}

export async function collectNow(): Promise<void> {
  if (collecting) return;
  collecting = true;
  try {
    const checkedAt = new Date().toISOString();
    const [login, game, database, control] = await Promise.all([
      serverCheck(process.env.LOGIN_SERVER_EXE, process.env.LOGIN_SERVER_HEARTBEAT_LOG, process.env.LOGIN_SERVER_HOST || '127.0.0.1', boundedNumber('LOGIN_SERVER_PORT', 10009, 1, 65535)),
      serverCheck(process.env.GAME_SERVER_EXE, process.env.GAME_SERVER_HEARTBEAT_LOG, process.env.GAME_SERVER_HOST || '127.0.0.1', boundedNumber('GAME_SERVER_PORT', 30010, 1, 65535)),
      databaseCheck(), readControl(),
    ]);
    telemetry = { checkedAt, valid: true, login, game, database };
    let next = decideState({ ...control, telemetry, now: new Date(), maxAgeMs });
    if (next === 'online') {
      consecutiveHealthy += 1;
      if (consecutiveHealthy < successThreshold && lastState !== 'online') next = 'partial';
      pendingFailure = null; consecutiveFailures = 0;
    } else {
      consecutiveHealthy = 0;
      const criticalCoreFailure = next === 'offline' && !login.process && !game.process && !login.socket && !game.socket;
      if (lastState === 'online' && !criticalCoreFailure) {
        if (pendingFailure === next) consecutiveFailures += 1;
        else { pendingFailure = next; consecutiveFailures = 1; }
        if (consecutiveFailures < failureThreshold) next = lastState;
      }
    }
    if (next !== lastState) {
      lastState = next;
      lastStateChangeAt = checkedAt;
      console.info(`[SERVER-STATUS] state=${next} at=${checkedAt}`);
    }
    publicStatus = makePublic(next, checkedAt, lastStateChangeAt, false);
    if (next === 'maintenance' && control.maintenanceMessage) publicStatus.message = control.maintenanceMessage;
  } catch {
    console.error('[SERVER-STATUS] collection failed');
  } finally { collecting = false; }
}

export function getPublicStatus(): PublicServerStatus {
  const age = Date.now() - new Date(publicStatus.checkedAt).getTime();
  return age > maxAgeMs ? makePublic('unknown', publicStatus.checkedAt, lastStateChangeAt, true) : publicStatus;
}

export function getPrivateTelemetry(): Telemetry | null { return telemetry; }

export function startStatusMonitor(): void {
  if (timer) return;
  void collectNow();
  timer = setInterval(() => void collectNow(), intervalMs);
  timer.unref();
}

export function verifyMonitorSignature(timestamp: string, nonce: string, signature: string, pathname: string): boolean {
  const secret = process.env.STATUS_HMAC_SECRET;
  const ts = Number(timestamp);
  const now = Date.now();
  for (const [value, expires] of seenNonces) if (expires <= now) seenNonces.delete(value);
  if (!secret || secret.length < 32 || !Number.isFinite(ts) || Math.abs(now - ts) > 30_000 || nonce.length < 16 || seenNonces.has(nonce)) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}\n${nonce}\nGET\n${pathname}`).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(signature || '');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (valid) seenNonces.set(nonce, now + 30_000);
  return valid;
}
