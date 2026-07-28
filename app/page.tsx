"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { PortalHeader, PortalFooter } from "./portal-shell";

interface ServiceStatus {
  status: 'online' | 'offline' | 'unknown';
  latencyMs: number | null;
}

interface ServerStatusData {
  status: 'online' | 'offline' | 'maintenance' | 'unknown';
  maintenance: boolean;
  maintenanceInfo?: {
    title: string | null;
    message: string | null;
    startedAt: string | null;
    expectedEndAt: string | null;
  };
  players: {
    online: number | null;
    capacity: number | null;
  };
  services: {
    loginServer: ServiceStatus;
    gameServer: ServiceStatus;
  };
  updatedAt: string;
  stale: boolean;
}

function StatusIndicator({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-emerald-500',
    offline: 'bg-rose-500',
    maintenance: 'bg-amber-500',
    unknown: 'bg-zinc-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${colors[status] || colors.unknown} ${status === 'online' ? 'animate-pulse' : ''}`} aria-hidden="true" />;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    online: 'ONLINE',
    offline: 'OFFLINE',
    maintenance: 'EM MANUTENCAO',
    unknown: 'STATUS INDISPONIVEL',
  };
  return labels[status] || 'STATUS INDISPONIVEL';
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    online: 'text-emerald-400',
    offline: 'text-rose-400',
    maintenance: 'text-amber-400',
    unknown: 'text-zinc-400',
  };
  return colors[status] || 'text-zinc-400';
}

function statusBorder(status: string): string {
  const borders: Record<string, string> = {
    online: 'border-emerald-500/30',
    offline: 'border-rose-500/30',
    maintenance: 'border-amber-500/30',
    unknown: 'border-zinc-700',
  };
  return borders[status] || 'border-zinc-700';
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

function ServerStatusBlock() {
  const [status, setStatus] = useState<ServerStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastValidTime, setLastValidTime] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/public/server-status', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (!data.stale) setLastValidTime(data.updatedAt);
      } else {
        setStatus(prev => prev ? { ...prev, stale: true } : null);
      }
    } catch {
      setStatus(prev => prev ? { ...prev, stale: true } : null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(() => fetchStatus(), 20000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStatus]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleRefresh = () => {
    if (cooldown > 0 || refreshing) return;
    setCooldown(10);
    fetchStatus(true);
  };

  const s = status?.status || 'unknown';

  if (loading) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 text-center" role="status">
        <span className="text-zinc-500 text-sm animate-pulse">Consultando status do servidor...</span>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900/80 border ${statusBorder(s)} rounded-lg p-6 space-y-4`} role="region" aria-label="Status do servidor" aria-live="polite">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusIndicator status={s} />
          <span className={`font-black text-lg uppercase tracking-wider ${statusColor(s)}`}>
            SERVIDOR {statusLabel(s)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {status?.updatedAt && (
            <span>
              Atualizado {formatTime(status.updatedAt)}
              {status.stale && <span className="text-amber-400 ml-1">(desatualizado)</span>}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={cooldown > 0 || refreshing}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-300 font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition text-xs"
            aria-label="Atualizar status"
          >
            {refreshing ? 'Atualizando...' : cooldown > 0 ? `${cooldown}s` : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Maintenance info */}
      {status?.maintenance && status.maintenanceInfo && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded text-sm">
          <strong className="text-amber-400">{status.maintenanceInfo.title || 'Manutencao em andamento'}</strong>
          {status.maintenanceInfo.message && <p className="text-zinc-400 mt-1">{status.maintenanceInfo.message}</p>}
          {status.maintenanceInfo.expectedEndAt && (
            <p className="text-zinc-500 mt-1 text-xs">Previsao de retorno: {formatTime(status.maintenanceInfo.expectedEndAt)}</p>
          )}
        </div>
      )}

      {/* Players and services */}
      {!status?.maintenance && (
        <>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-zinc-500 text-xs uppercase font-bold block">Jogadores Online</span>
              <strong className="text-zinc-200 text-lg">
                {status?.players.online !== null && status?.players.online !== undefined
                  ? status.players.online
                  : 'indisponivel'}
              </strong>
              {status?.players.capacity && status.players.online !== null && (
                <span className="text-zinc-500 text-xs"> de {status.players.capacity}</span>
              )}
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold block">Login Server</span>
                <span className={`font-bold ${statusColor(status?.services.loginServer.status || 'unknown')}`}>
                  {statusLabel(status?.services.loginServer.status || 'unknown')}
                </span>
                {status?.services.loginServer.latencyMs !== null && status?.services.loginServer.latencyMs !== undefined && (
                  <span className="text-zinc-500 text-xs ml-2">{status.services.loginServer.latencyMs} ms</span>
                )}
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold block">Game Server</span>
                <span className={`font-bold ${statusColor(status?.services.gameServer.status || 'unknown')}`}>
                  {statusLabel(status?.services.gameServer.status || 'unknown')}
                </span>
                {status?.services.gameServer.latencyMs !== null && status?.services.gameServer.latencyMs !== undefined && (
                  <span className="text-zinc-500 text-xs ml-2">{status.services.gameServer.latencyMs} ms</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fallback message */}
      {!status && (
        <p className="text-zinc-500 text-sm">
          Nao foi possivel consultar o servidor neste momento. Tente atualizar novamente em alguns instantes.
          {lastValidTime && <span className="block mt-1">Ultimo status confirmado as {formatTime(lastValidTime)}</span>}
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 pt-2">
        {s === 'online' && (
          <>
            <Link href="/criar-conta" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase tracking-wider text-xs rounded transition shadow-lg shadow-amber-500/20">
              Criar Conta Gratis
            </Link>
            <Link href="/download" className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded transition">
              Baixar o Jogo
            </Link>
          </>
        )}
        {s === 'offline' && (
          <>
            <button onClick={handleRefresh} disabled={cooldown > 0} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded transition disabled:opacity-40">
              Verificar Novamente
            </button>
            <Link href="/noticias" className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded transition">
              Ver Noticias
            </Link>
          </>
        )}
        {s === 'maintenance' && (
          <>
            <button onClick={handleRefresh} disabled={cooldown > 0} className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-100 font-bold uppercase tracking-wider text-xs rounded transition disabled:opacity-40">
              Acompanhar Manutencao
            </button>
            <Link href="/noticias" className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded transition">
              Ver Noticias
            </Link>
          </>
        )}
        {s === 'unknown' && (
          <button onClick={handleRefresh} disabled={cooldown > 0} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded transition disabled:opacity-40">
            Tentar Novamente
          </button>
        )}
        <Link href="/clas" className="px-5 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-xs rounded transition">
          Clas
        </Link>
        <Link href="/rankings" className="px-5 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-xs rounded transition">
          Rankings
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Barra superior de acoes rapidas */}
      <div className="bg-zinc-900 border-b border-zinc-800 text-xs py-2 px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-zinc-400">Versao: 1.0.0 Stable</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/criar-conta" className="text-emerald-400 hover:text-emerald-300 font-extrabold tracking-wider uppercase">
            Criar Conta Gratis
          </Link>
          <Link href="/download" className="text-zinc-300 hover:text-zinc-100 font-bold uppercase">
            Baixar o Jogo
          </Link>
          <Link href="/rankings" className="text-zinc-400 hover:text-zinc-200 uppercase">
            Rankings
          </Link>
          <Link href="/clas" className="text-zinc-400 hover:text-zinc-200 uppercase">
            Clas
          </Link>
          <Link href="/shop" className="text-zinc-400 hover:text-zinc-200 uppercase">
            Shop
          </Link>
          <Link href="/entrar" className="text-amber-400 hover:text-amber-300 font-bold uppercase">
            Minha Conta
          </Link>
        </div>
      </div>

      <PortalHeader />

      {/* HERO + SERVER STATUS */}
      <section className="relative min-h-[85vh] flex items-center justify-center border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden py-16">
        <div className="absolute inset-0 bg-[url('/upt-hero.webp')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center px-6 z-10 space-y-6">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded">
            MMORPG Classico Brasileiro
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-cream font-medium tracking-tight leading-none">
            Seu Novo Universo <br />
            <span className="text-amber-400 italic">Comeca Aqui</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Reviva a jornada classica de Priston Tale em um servidor preparado para comunidade, competicao, eventos dinamicos e evolucao estavel.
          </p>

          {/* SERVER STATUS BLOCK */}
          <div className="max-w-2xl mx-auto pt-4">
            <ServerStatusBlock />
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto pt-8 border-t border-zinc-900/60 text-center">
            <div>
              <span className="block text-zinc-500 text-xxs uppercase font-bold tracking-widest">Nivel Maximo</span>
              <strong className="text-lg text-zinc-300">199</strong>
            </div>
            <div>
              <span className="block text-zinc-500 text-xxs uppercase font-bold tracking-widest">XP Rate</span>
              <strong className="text-lg text-zinc-300">Classica</strong>
            </div>
            <div>
              <span className="block text-zinc-500 text-xxs uppercase font-bold tracking-widest">Acesso</span>
              <strong className="text-lg text-zinc-300">Gratuito</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Passos para comecar */}
      <section className="py-16 bg-zinc-900/40 border-b border-zinc-900/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Guia Rapido</span>
            <h2 className="text-3xl font-serif mt-2">Comece a Jogar em 3 Passos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
              <span className="text-3xl font-serif text-amber-400 italic">01</span>
              <h3 className="text-lg font-bold">Crie sua Conta</h3>
              <p className="text-zinc-400 text-sm">Registre suas credenciais com seguranca em nosso formulario e valide seu e-mail.</p>
              <Link href="/criar-conta" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-wider block pt-2">Criar conta agora</Link>
            </div>
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
              <span className="text-3xl font-serif text-amber-400 italic">02</span>
              <h3 className="text-lg font-bold">Baixe o Cliente</h3>
              <p className="text-zinc-400 text-sm">Faca o download do instalador completo e atualize pelo launcher oficial do UPT.</p>
              <Link href="/download" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-wider block pt-2">Baixar instalador</Link>
            </div>
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
              <span className="text-3xl font-serif text-amber-400 italic">03</span>
              <h3 className="text-lg font-bold">Jogue no Servidor</h3>
              <p className="text-zinc-400 text-sm">Escolha sua tribo, selecione seu heroi e inicie sua jornada lendaria no Priston.</p>
              <Link href="/suporte" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-wider block pt-2">Ver guias de ajuda</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Eventos */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="flex flex-wrap justify-between items-end gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Cronograma Semanal</span>
              <h2 className="text-4xl font-serif mt-2">Eventos Ativos</h2>
            </div>
            <Link href="/eventos" className="text-sm text-amber-400 hover:underline font-bold uppercase">Ver Calendario Completo</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold">Aventura Semanal</span>
                <h3 className="text-xl font-bold mt-2">Bless Castle</h3>
                <p className="text-zinc-400 text-sm mt-3">A maior batalha PvP de clas pelo dominio do castelo classico do Priston Tale.</p>
              </div>
              <span className="text-xxs bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold uppercase px-2 py-1 rounded inline-block self-start mt-4">Integrado</span>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold">Evolucao acelerada</span>
                <h3 className="text-xl font-bold mt-2">XP Semanal Especial</h3>
                <p className="text-zinc-400 text-sm mt-3">Taxas especiais aplicadas no servidor UPT em horarios agendados.</p>
              </div>
              <span className="text-xxs bg-amber-500/15 border border-amber-500/20 text-amber-400 font-bold uppercase px-2 py-1 rounded inline-block self-start mt-4">Em breve</span>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold">Especial</span>
                <h3 className="text-xl font-bold mt-2">Bellatra PVP</h3>
                <p className="text-zinc-400 text-sm mt-3">Arena de sobrevivencia em grupos com rankings atualizados no portal.</p>
              </div>
              <span className="text-xxs bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold uppercase px-2 py-1 rounded inline-block self-start mt-4">Homologando</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="py-20 bg-zinc-900/20 border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Hall da Fama</span>
            <h2 className="text-4xl font-serif mt-2">Rankings do Universo</h2>
            <p className="text-zinc-400 text-sm mt-2">Top 5 herois lendarios em atividade no servidor UPT.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-850 grid grid-cols-4 text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">
              <span>Posicao</span>
              <span>Personagem</span>
              <span>Classe</span>
              <span>Nivel</span>
            </div>
            <div className="divide-y divide-zinc-850/60 text-center text-sm">
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-amber-400 font-serif italic text-lg">1</span>
                <strong className="text-cream">BetoDavi</strong>
                <span className="text-zinc-400">Guerreiro</span>
                <strong className="text-zinc-200">105</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-400 font-serif italic text-lg">2</span>
                <strong className="text-cream">PristonHero</strong>
                <span className="text-zinc-400">Mago</span>
                <strong className="text-zinc-200">102</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-400 font-serif italic text-lg">3</span>
                <strong className="text-cream">AngelPri</strong>
                <span className="text-zinc-400">Atiradora</span>
                <strong className="text-zinc-200">101</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-500 font-serif text-base">4</span>
                <strong className="text-cream">TaleKnight</strong>
                <span className="text-zinc-400">Cavaleiro</span>
                <strong className="text-zinc-200">99</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-500 font-serif text-base">5</span>
                <strong className="text-cream">LunaPri</strong>
                <span className="text-zinc-400">Sacerdotisa</span>
                <strong className="text-zinc-200">98</strong>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link href="/rankings" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-widest">
              Ver Classificacao Completa
            </Link>
          </div>
        </div>
      </section>

      <PortalFooter />
    </div>
  );
}
