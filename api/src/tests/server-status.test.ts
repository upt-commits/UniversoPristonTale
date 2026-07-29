import assert from 'node:assert/strict';
import test from 'node:test';
import { decideState } from '../server-status/state-machine';
import { DecisionInput, ReadinessCheck, Telemetry } from '../server-status/types';
import crypto from 'node:crypto';
import { getPublicStatus, verifyMonitorSignature } from '../server-status/monitor';

const now = new Date('2026-07-29T12:00:00.000Z');
const ready: ReadinessCheck = { process: true, socket: true, heartbeat: true, ready: true };
const down: ReadinessCheck = { process: false, socket: false, heartbeat: false, ready: false };
const telemetry = (login: ReadinessCheck, game: ReadinessCheck, db = true, degraded = false): Telemetry => ({
  checkedAt: now.toISOString(), valid: true, login, game, database: { ready: db, degraded },
});
const input = (overrides: Partial<DecisionInput>): DecisionInput => ({ maintenance: false, operation: null, telemetry: telemetry(ready, ready), now, maxAgeMs: 45_000, ...overrides });

test('state priority and critical matrix', () => {
  assert.equal(decideState(input({ maintenance: true })), 'maintenance');
  assert.equal(decideState(input({ operation: { operationId:'1', type:'restarting', startedAt:now.toISOString(), deadlineAt:'2026-07-29T12:01:00.000Z', state:'active' } })), 'restarting');
  assert.equal(decideState(input({ operation: { operationId:'2', type:'starting', startedAt:now.toISOString(), deadlineAt:'2026-07-29T12:01:00.000Z', state:'active' } })), 'starting');
  assert.equal(decideState(input({ telemetry: null })), 'unknown');
  assert.equal(decideState(input({})), 'online');
  assert.equal(decideState(input({ telemetry: telemetry(ready, ready, true, true) })), 'degraded');
  assert.equal(decideState(input({ telemetry: telemetry(ready, down) })), 'partial');
  assert.equal(decideState(input({ telemetry: telemetry(down, ready) })), 'partial');
  assert.equal(decideState(input({ telemetry: telemetry(down, down) })), 'offline');
  assert.equal(decideState(input({ telemetry: telemetry(ready, ready, false) })), 'partial');
});

test('expired operation never remains transitional', () => {
  const operation = { operationId:'3', type:'starting' as const, startedAt:'2026-07-29T11:00:00.000Z', deadlineAt:'2026-07-29T11:01:00.000Z', state:'active' as const };
  assert.equal(decideState(input({ operation, telemetry: telemetry(down, down) })), 'offline');
});

test('stale or invalid telemetry is unknown', () => {
  assert.equal(decideState(input({ telemetry: { ...telemetry(ready, ready), checkedAt:'2026-07-29T11:00:00.000Z' } })), 'unknown');
  assert.equal(decideState(input({ telemetry: { ...telemetry(ready, ready), valid:false } })), 'unknown');
});

test('public schema is closed and contains no internal diagnostics', () => {
  const status = getPublicStatus();
  assert.deepEqual(Object.keys(status).sort(), ['checkedAt','label','lastStateChangeAt','message','schemaVersion','stale','state','world'].sort());
  assert.doesNotMatch(JSON.stringify(status), /process|socket|database|port|path|password/i);
});

test('HMAC rejects replayed nonce', () => {
  process.env.STATUS_HMAC_SECRET = 'test-secret-that-is-longer-than-32-characters';
  const timestamp = String(Date.now()); const nonce = '0123456789abcdef0123456789abcdef'; const pathname = '/server-status';
  const signature = crypto.createHmac('sha256', process.env.STATUS_HMAC_SECRET).update(`${timestamp}\n${nonce}\nGET\n${pathname}`).digest('hex');
  assert.equal(verifyMonitorSignature(timestamp, nonce, signature, pathname), true);
  assert.equal(verifyMonitorSignature(timestamp, nonce, signature, pathname), false);
});
