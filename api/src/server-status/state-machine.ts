import { DecisionInput, ServerState } from './types';

export const STATUS_PRESENTATION: Record<ServerState, { label: string; message: string }> = {
  online: { label: 'Online', message: 'Servidor operando normalmente.' },
  offline: { label: 'Offline', message: 'Servidor temporariamente indisponível.' },
  starting: { label: 'Iniciando', message: 'O mundo está sendo iniciado.' },
  restarting: { label: 'Reiniciando', message: 'Reinicialização em andamento.' },
  partial: { label: 'Parcial', message: 'Alguns serviços ainda não estão disponíveis.' },
  degraded: { label: 'Instável', message: 'Servidor online com instabilidade.' },
  maintenance: { label: 'Manutenção', message: 'Manutenção programada em andamento.' },
  unknown: { label: 'Indisponível', message: 'Não foi possível confirmar o status agora.' },
};

export function decideState(input: DecisionInput): ServerState {
  if (input.maintenance) return 'maintenance';
  if (input.operation?.state === 'active' && new Date(input.operation.deadlineAt) > input.now) {
    return input.operation.type;
  }
  const telemetry = input.telemetry;
  if (!telemetry || !telemetry.valid) return 'unknown';
  const age = input.now.getTime() - new Date(telemetry.checkedAt).getTime();
  if (!Number.isFinite(age) || age < 0 || age > input.maxAgeMs) return 'unknown';

  const { login, game, database } = telemetry;
  if (login.ready && game.ready && database.ready) {
    return database.degraded ? 'degraded' : 'online';
  }
  if (!login.process && !game.process) return 'offline';
  if (login.ready || game.ready || login.process || game.process) return 'partial';
  return 'offline';
}
