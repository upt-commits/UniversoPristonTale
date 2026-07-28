"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('upt_session_token');
      if (!token) {
        setError('Sessao nao encontrada. Por favor, faca login.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/player/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
          setData(result);
        } else {
          setError(result.error?.message || 'Falha ao carregar perfil.');
        }
      } catch (err) {
        setError('Falha ao comunicar com o servidor da API.');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('upt_session_token');
    window.location.href = '/entrar';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <span className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Carregando painel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-rose-500/30 rounded p-8 text-center space-y-6">
          <p className="text-rose-400 font-semibold">{error}</p>
          <Link href="/entrar" className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold uppercase text-xs tracking-wider">
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Painel de Controle</span>
            <h1 className="text-2xl font-black uppercase tracking-wider mt-1">Ola, {data?.account?.username}</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded font-bold uppercase tracking-wider text-xs transition">
            Sair
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dados da Conta */}
          <section className="bg-zinc-900 border border-zinc-850 rounded p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-800 pb-2">Minha Conta</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-zinc-500 block text-xs uppercase font-semibold">Conta UPT</span><strong>{data?.account?.username}</strong></div>
              <div><span className="text-zinc-500 block text-xs uppercase font-semibold">E-mail</span><strong>{data?.account?.email}</strong></div>
              <div><span className="text-zinc-500 block text-xs uppercase font-semibold">Tipo</span><strong>{data?.account?.isMinor ? 'Conta Menor de Idade' : 'Conta Standard'}</strong></div>
            </div>
          </section>

          {/* Dados Pessoais Mascarados */}
          <section className="bg-zinc-900 border border-zinc-850 rounded p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-800 pb-2">Dados Pessoais</h2>
            {data?.profile ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-zinc-500 block text-xs uppercase font-semibold">Nome Completo</span><strong>{data.profile.fullName}</strong></div>
                <div><span className="text-zinc-500 block text-xs uppercase font-semibold">CPF Mascarado</span><strong>{data.profile.cpf}</strong></div>
                <div><span className="text-zinc-500 block text-xs uppercase font-semibold">CEP</span><strong>{data.profile.cep}</strong></div>
              </div>
            ) : (
              <p className="text-zinc-500 text-xs">Dados cadastrais de perfil nao preenchidos para esta conta.</p>
            )}
          </section>

          {/* Controles de Privacidade */}
          <section className="bg-zinc-900 border border-zinc-850 rounded p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-800 pb-2">Seguranca & LGPD</h2>
            <div className="space-y-2 text-xs text-zinc-400">
              <p>Conforme a LGPD, voce pode solicitar copia, correcao ou exclusao total dos seus dados de cadastro UPT.</p>
              <button disabled className="w-full py-2 bg-zinc-850 border border-zinc-800 rounded font-semibold text-zinc-500 cursor-not-allowed">Solicitar Acesso (LGPD)</button>
              {data?.account?.isMinor && <p className="text-amber-400 font-semibold mt-2">Controles Parentais Ativos para Conta Menor.</p>}
            </div>
          </section>
        </div>

        {/* Personagens Reais do Jogo */}
        <section className="bg-zinc-900 border border-zinc-850 rounded p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-800 pb-2">Personagens no Servidor UPT</h2>
          {data?.characters && data.characters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.characters.map((char: any) => (
                <div key={char.Name} className="p-4 bg-black border border-zinc-800 rounded flex justify-between items-center">
                  <div>
                    <strong className="text-emerald-400 block text-base font-bold">{char.Name}</strong>
                    <span className="text-zinc-500 text-xs uppercase font-semibold">{char.Class || 'Sem Classe'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Nivel</span>
                    <strong className="text-zinc-200 text-lg font-black">{char.Level}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 text-sm">Nenhum personagem criado nesta conta de jogo ainda. Abra o Game.exe e crie seu heroi!</div>
          )}
        </section>
      </div>
    </div>
  );
}
