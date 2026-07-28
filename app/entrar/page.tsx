"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/conta';
      } else if (data.error?.code === 'UPT-AUTH-EMAIL-UNVERIFIED') {
        window.location.href = `/verificar-email?accountId=${data.error.accountId}&email=${encodeURIComponent(data.error.emailMasked || '')}`;
      } else {
        setError(data.error?.message || 'Usuario ou senha incorretos.');
      }
    } catch {
      setError('Falha ao comunicar com o servidor da API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Acesso Seguro</span>
          <h1 className="text-2xl font-black uppercase tracking-wider mt-1">Minha Conta UPT</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-sm font-semibold" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Nome da conta</label>
            <input name="account" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Senha</label>
            <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase tracking-wider text-xs rounded transition shadow-lg shadow-emerald-500/10 disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="flex justify-between text-xs text-zinc-400 pt-6 border-t border-zinc-800 mt-6">
          <Link href="/criar-conta" className="hover:text-emerald-400">Criar uma conta</Link>
          <Link href="/suporte" className="hover:text-emerald-400">Preciso de ajuda</Link>
        </div>
      </div>
    </div>
  );
}
