"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PortalHeader, PortalFooter } from "./portal-shell";

export default function Home() {
  const [serverStatus, setServerStatus] = useState("Carregando...");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json() as any;
          if (data.status?.includes("secure")) {
            setServerStatus("Online");
          } else {
            setServerStatus("Manutenção");
          }
        } else {
          setServerStatus("Manutenção");
        }
      } catch (e) {
        setServerStatus("Offline");
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* 1. Barra superior de ações rápidas */}
      <div className="bg-zinc-900 border-b border-zinc-800 text-xs py-2 px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${serverStatus === "Online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="font-bold text-zinc-300">Servidor: {serverStatus}</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Versão: 1.0.0 Stable</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/criar-conta" className="text-emerald-400 hover:text-emerald-300 font-extrabold tracking-wider uppercase">
            Criar Conta Grátis
          </Link>
          <Link href="/download" className="text-zinc-300 hover:text-zinc-100 font-bold uppercase">
            Baixar o Jogo
          </Link>
          <Link href="/rankings" className="text-zinc-400 hover:text-zinc-200 uppercase">
            Rankings
          </Link>
          <Link href="/clas" className="text-zinc-400 hover:text-zinc-200 uppercase">
            Clãs
          </Link>
          <Link href="/shop" className="text-zinc-400 hover:text-zinc-200 uppercase">
            Shop
          </Link>
          <Link href="/entrar" className="text-amber-400 hover:text-amber-300 font-bold uppercase">
            Minha Conta
          </Link>
        </div>
      </div>

      {/* 2. Cabeçalho principal e menu */}
      <PortalHeader />

      {/* SEÇÃO 1: HERO PRINCIPAL */}
      <section className="relative min-h-[85vh] flex items-center justify-center border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden py-16">
        <div className="absolute inset-0 bg-[url('/upt-hero.webp')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto text-center px-6 z-10 space-y-6">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded">
            MMORPG Clássico Brasileiro
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-cream font-medium tracking-tight leading-none">
            Seu Novo Universo <br />
            <span className="text-amber-400 italic">Começa Aqui</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Reviva a jornada clássica de Priston Tale em um servidor preparado para comunidade, competição, eventos dinâmicos e evolução estável.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/criar-conta" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase tracking-wider text-sm rounded transition shadow-lg shadow-amber-500/20">
              Criar Conta Grátis
            </Link>
            <Link href="/download" className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold uppercase tracking-wider text-sm rounded transition">
              Baixar o Jogo
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto pt-8 border-t border-zinc-900/60 text-center">
            <div>
              <span className="block text-zinc-500 text-xxs uppercase font-bold tracking-widest">Nível Máximo</span>
              <strong className="text-lg text-zinc-300">199</strong>
            </div>
            <div>
              <span className="block text-zinc-500 text-xxs uppercase font-bold tracking-widest">XP Rate</span>
              <strong className="text-lg text-zinc-300">Clássica</strong>
            </div>
            <div>
              <span className="block text-zinc-500 text-xxs uppercase font-bold tracking-widest">Acesso</span>
              <strong className="text-lg text-zinc-300">Gratuito</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: PASSOS PARA COMEÇAR A JOGAR */}
      <section className="py-16 bg-zinc-900/40 border-b border-zinc-900/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Guia Rápido</span>
            <h2 className="text-3xl font-serif mt-2">Comece a Jogar em 3 Passos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
              <span className="text-3xl font-serif text-amber-400 italic">01</span>
              <h3 className="text-lg font-bold">Crie sua Conta</h3>
              <p className="text-zinc-400 text-sm">Registre suas credenciais com segurança em nosso formulário e valide seu e-mail.</p>
              <Link href="/criar-conta" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-wider block pt-2">Criar conta agora →</Link>
            </div>
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
              <span className="text-3xl font-serif text-amber-400 italic">02</span>
              <h3 className="text-lg font-bold">Baixe o Cliente</h3>
              <p className="text-zinc-400 text-sm">Faça o download do instalador completo e atualize pelo launcher oficial do UPT.</p>
              <Link href="/download" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-wider block pt-2">Baixar instalador →</Link>
            </div>
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
              <span className="text-3xl font-serif text-amber-400 italic">03</span>
              <h3 className="text-lg font-bold">Jogue no Servidor</h3>
              <p className="text-zinc-400 text-sm">Escolha sua tribo, selecione seu herói e inicie sua jornada lendária no Priston.</p>
              <Link href="/suporte" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-wider block pt-2">Ver guias de ajuda →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: EVENTOS EM DESTAQUE */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="flex flex-wrap justify-between items-end gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Cronograma Semanal</span>
              <h2 className="text-4xl font-serif mt-2">Eventos Ativos</h2>
            </div>
            <Link href="/eventos" className="text-sm text-amber-400 hover:underline font-bold uppercase">Ver Calendário Completo →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold">Aventura Semanal</span>
                <h3 className="text-xl font-bold mt-2">Bless Castle</h3>
                <p className="text-zinc-400 text-sm mt-3">A maior batalha PvP de clãs pelo domínio do castelo clássico do Priston Tale.</p>
              </div>
              <span className="text-xxs bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold uppercase px-2 py-1 rounded inline-block self-start mt-4">Integrado</span>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold">Evolução acelerada</span>
                <h3 className="text-xl font-bold mt-2">XP Semanal Especial</h3>
                <p className="text-zinc-400 text-sm mt-3">Taxas especiais aplicadas no servidor UPT em horários agendados.</p>
              </div>
              <span className="text-xxs bg-amber-500/15 border border-amber-500/20 text-amber-400 font-bold uppercase px-2 py-1 rounded inline-block self-start mt-4">Em breve</span>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold">Especial</span>
                <h3 className="text-xl font-bold mt-2">Bellatra PVP</h3>
                <p className="text-zinc-400 text-sm mt-3">Arena de sobrevivência em grupos com rankings atualizados no portal.</p>
              </div>
              <span className="text-xxs bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold uppercase px-2 py-1 rounded inline-block self-start mt-4">Homologando</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: RANKINGS DO SERVIDOR */}
      <section className="py-20 bg-zinc-900/20 border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Hall da Fama</span>
            <h2 className="text-4xl font-serif mt-2">Rankings do Universo</h2>
            <p className="text-zinc-400 text-sm mt-2">Top 5 heróis lendários em atividade no servidor UPT.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-850 grid grid-cols-4 text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">
              <span>Posição</span>
              <span>Personagem</span>
              <span>Classe</span>
              <span>Nível</span>
            </div>
            <div className="divide-y divide-zinc-850/60 text-center text-sm">
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-amber-400 font-serif italic text-lg">1º</span>
                <strong className="text-cream">BetoDavi</strong>
                <span className="text-zinc-400">Guerreiro</span>
                <strong className="text-zinc-200">105</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-400 font-serif italic text-lg">2º</span>
                <strong className="text-cream">PristonHero</strong>
                <span className="text-zinc-400">Mago</span>
                <strong className="text-zinc-200">102</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-400 font-serif italic text-lg">3º</span>
                <strong className="text-cream">AngelPri</strong>
                <span className="text-zinc-400">Atiradora</span>
                <strong className="text-zinc-200">101</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-500 font-serif text-base">4º</span>
                <strong className="text-cream">TaleKnight</strong>
                <span className="text-zinc-400">Cavaleiro</span>
                <strong className="text-zinc-200">99</strong>
              </div>
              <div className="p-4 grid grid-cols-4 items-center">
                <span className="text-zinc-500 font-serif text-base">5º</span>
                <strong className="text-cream">LunaPri</strong>
                <span className="text-zinc-400">Sacerdotisa</span>
                <strong className="text-zinc-200">98</strong>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link href="/rankings" className="text-xs text-amber-400 hover:underline font-bold uppercase tracking-widest">
              Ver Classificação Completa →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Rodapé institucional */}
      <PortalFooter />
    </div>
  );
}
