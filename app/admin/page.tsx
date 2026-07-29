"use client";

import { useEffect, useState } from 'react';
import Turnstile from '@/components/Turnstile';

type Status = {
  portal: string;
  api: string;
  portalDatabase: string;
  gameDatabase: string;
  loginServer: string;
  gameServer: string;
  updatedAt: string;
};

export default function AdminPage() {
  const [phase, setPhase] = useState<'login' | 'mfa' | 'enroll' | 'dashboard'>('login');
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  async function load() {
    const response = await fetch('/api/admin/status', { credentials: 'include' });
    if (response.ok) {
      setStatus(await response.json());
      setPhase('dashboard');
    }
  }

  useEffect(() => { void load(); }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
        captchaToken,
      }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error?.message || 'Acesso negado.');
    if (data.enrollmentRequired) {
      const enrollment = await fetch('/api/admin/mfa/enroll', { method: 'POST', credentials: 'include' });
      const enrollmentData = await enrollment.json();
      setSecret(enrollmentData.secret);
      setPhase('enroll');
    } else setPhase('mfa');
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: form.get('code') }),
    });
    if (response.ok) await load();
    else setError('Código MFA inválido.');
  }

  if (phase === 'dashboard' && status) return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black">Painel Administrativo UPT</h1>
        <p className="mt-2 text-zinc-400">Status real das dependências. Operações sensíveis permanecem desabilitadas sem integração local segura.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Object.entries(status).filter(([key]) => key !== 'updatedAt').map(([key, value]) => (
            <section key={key} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">{key}</p>
              <strong className={value === 'Online' ? 'text-emerald-400' : 'text-rose-400'}>{value}</strong>
            </section>
          ))}
        </div>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-2xl font-black">Administração UPT</h1>
        <p className="mt-2 text-sm text-zinc-400">Acesso restrito, auditado e protegido por CAPTCHA e MFA.</p>
        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
        {phase === 'login' ? (
          <form onSubmit={login} className="mt-6 space-y-4">
            <input name="username" aria-label="Usuário" placeholder="Usuário" className="w-full rounded bg-black p-3" required />
            <input name="password" type="password" aria-label="Senha" placeholder="Senha" className="w-full rounded bg-black p-3" required />
            <Turnstile action="admin_login" onToken={setCaptchaToken} />
            <button className="w-full rounded bg-emerald-500 p-3 font-bold text-black">Continuar</button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-4">
            {phase === 'enroll' && <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <p>Cadastre esta chave no aplicativo autenticador:</p>
              <code className="mt-2 block break-all">{secret}</code>
            </div>}
            <input name="code" inputMode="numeric" pattern="[0-9]{6}" aria-label="Código MFA" placeholder="Código de 6 dígitos" className="w-full rounded bg-black p-3" required />
            <button className="w-full rounded bg-emerald-500 p-3 font-bold text-black">Verificar MFA</button>
          </form>
        )}
      </div>
    </main>
  );
}
