"use client";

import { useEffect, useRef, useState } from 'react';

type State = 'online'|'offline'|'starting'|'restarting'|'partial'|'degraded'|'maintenance'|'unknown';
type Status = { schemaVersion: 1; world: string; state: State; label: string; message: string; checkedAt: string; lastStateChangeAt: string; stale: boolean };

const labels: Record<State, string> = { online:'Online', offline:'Offline', starting:'Iniciando', restarting:'Reiniciando', partial:'Parcial', degraded:'Instável', maintenance:'Manutenção', unknown:'Indisponível' };

function relativeTime(iso: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `há ${seconds} segundo${seconds === 1 ? '' : 's'}`;
  const minutes = Math.floor(seconds / 60);
  return `há ${minutes} minuto${minutes === 1 ? '' : 's'}`;
}

export function ServerStatusCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [now, setNow] = useState(0);
  const lastValid = useRef<Status | null>(null);
  const active = useRef<AbortController | null>(null);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      if (stopped || document.hidden || active.current) return;
      const controller = new AbortController(); active.current = controller;
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch('/api/public/server-status', { signal: controller.signal, headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error('status-unavailable');
        const data = await response.json() as Status;
        if (data.schemaVersion !== 1 || !(data.state in labels)) throw new Error('invalid-status');
        lastValid.current = data; if (!stopped) setStatus(data);
      } catch {
        const previous = lastValid.current;
        if (!stopped && (!previous || Date.now() - new Date(previous.checkedAt).getTime() > 45_000)) {
          const checkedAt = previous?.checkedAt ?? new Date().toISOString();
          setStatus(previous ? { ...previous, state:'unknown', label:labels.unknown, message:'Não foi possível confirmar o status agora.', stale:true } : {
            schemaVersion:1, world:'UPT — Temporada 1', state:'unknown', label:labels.unknown,
            message:'Não foi possível confirmar o status agora.', checkedAt, lastStateChangeAt:checkedAt, stale:true,
          });
        }
      } finally { clearTimeout(timeout); active.current = null; }
    };
    void load();
    const poll = setInterval(load, 15_000);
    const clock = setInterval(() => setNow(Date.now()), 1_000);
    const visible = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', visible);
    return () => { stopped = true; clearInterval(poll); clearInterval(clock); document.removeEventListener('visibilitychange', visible); active.current?.abort(); };
  }, []);

  const state = status?.state ?? 'unknown';
  const absolute = status ? new Intl.DateTimeFormat('pt-BR', { timeZone:'America/Sao_Paulo', dateStyle:'short', timeStyle:'medium' }).format(new Date(status.checkedAt)) + ' (America/Sao_Paulo)' : 'Verificando status do servidor';
  return <aside className={`server-panel status-${state}`} aria-label="Status do servidor" aria-live="polite">
    <div className="panel-heading"><div><span>Status do mundo</span><strong>UPT — Temporada 1</strong></div>
      <span className={`status-badge${status ? '' : ' status-loading'}`}><i aria-hidden="true" /> {status?.label ?? 'Verificando…'}</span>
    </div>
    <div className="server-stats"><div><span>Servidor</span><strong>Brasil</strong></div><div><span>Idioma</span><strong>PT-BR</strong></div><div><span>Acesso</span><strong>Gratuito</strong></div></div>
    <p className="status-message">{status?.message ?? 'Consultando a prontidão do mundo.'}</p>
    <div className="panel-footer"><span>Última atualização</span><strong title={absolute}>{status ? relativeTime(status.checkedAt, now) : 'Verificando…'}</strong></div>
  </aside>;
}
