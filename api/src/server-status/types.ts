export const SERVER_STATES = [
  'online', 'offline', 'starting', 'restarting', 'partial',
  'degraded', 'maintenance', 'unknown',
] as const;

export type ServerState = typeof SERVER_STATES[number];

export interface ReadinessCheck {
  process: boolean;
  socket: boolean;
  heartbeat: boolean;
  ready: boolean;
}

export interface Telemetry {
  checkedAt: string;
  valid: boolean;
  login: ReadinessCheck;
  game: ReadinessCheck;
  database: { ready: boolean; degraded: boolean };
}

export interface Operation {
  operationId: string;
  type: 'starting' | 'restarting';
  startedAt: string;
  deadlineAt: string;
  state: 'active' | 'completed' | 'failed';
  initiatedBy?: string;
}

export interface DecisionInput {
  maintenance: boolean;
  operation: Operation | null;
  telemetry: Telemetry | null;
  now: Date;
  maxAgeMs: number;
}

export interface PublicServerStatus {
  schemaVersion: 1;
  world: 'UPT — Temporada 1';
  state: ServerState;
  label: string;
  message: string;
  checkedAt: string;
  lastStateChangeAt: string;
  stale: boolean;
}
