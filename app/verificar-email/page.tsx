"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [emailMasked, setEmailMasked] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('accountId');
    const email = params.get('email');
    if (id) setAccountId(Number(id));
    if (email) setEmailMasked(email);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || code.length !== 6) {
      setError('Digite o codigo de 6 digitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accountId, code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Codigo invalido.');
      }
    } catch {
      setError('Falha ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!accountId || resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
        if (data.emailMasked) setEmailMasked(data.emailMasked);
      } else {
        setError(data.error?.message || 'Falha ao reenviar.');
      }
    } catch {
      setError('Falha ao comunicar com o servidor.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 6);
    setCode(val);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-emerald-500/30 rounded-lg p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-400 text-2xl" aria-hidden="true">&#10003;</span>
          </div>
          <h2 className="text-2xl font-black text-emerald-400 mb-4 tracking-wider">E-MAIL VERIFICADO!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">Sua conta foi ativada com sucesso. Voce ja pode fazer login no portal e no Game.exe.</p>
          <Link href="/entrar" className="block w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-100 rounded font-bold uppercase tracking-wider text-sm transition">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Verificacao de E-mail</span>
          <h1 className="text-2xl font-black uppercase tracking-wider mt-2">Confirme sua Conta</h1>
          {emailMasked && (
            <p className="text-zinc-400 text-sm mt-4">
              Enviamos um codigo de 6 digitos para <strong className="text-zinc-200">{emailMasked}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-sm font-semibold" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="otp-code" className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
              Codigo de Verificacao
            </label>
            <input
              ref={inputRef}
              id="otp-code"
              value={code}
              onChange={handleCodeChange}
              className="w-full bg-black border border-zinc-800 rounded px-4 py-4 focus:outline-none focus:border-emerald-500 text-zinc-200 text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              aria-describedby="otp-hint"
            />
            <p id="otp-hint" className="text-zinc-500 text-xs mt-2">O codigo expira em 10 minutos.</p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase tracking-wider text-xs rounded transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Confirmar Codigo'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-xs mb-3">Nao recebeu o codigo?</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider disabled:text-zinc-600 disabled:cursor-not-allowed transition"
          >
            {resendLoading
              ? 'Enviando...'
              : resendCooldown > 0
                ? `Reenviar em ${resendCooldown}s`
                : 'Reenviar Codigo'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/entrar" className="text-zinc-400 hover:text-zinc-200 text-xs">Voltar para login</Link>
        </div>
      </div>
    </div>
  );
}
