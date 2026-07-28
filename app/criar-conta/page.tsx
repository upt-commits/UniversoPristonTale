"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CaptchaConfig {
  provider: string;
  siteKey: string | null;
  required: boolean;
  registrationEnabled: boolean;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formStartTime] = useState(Date.now());
  const [captchaConfig, setCaptchaConfig] = useState<CaptchaConfig | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    fullName: '', birthDate: '', cpf: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP',
    termsAccepted: false, guardianName: '', guardianCPF: '', marketingAccepted: false,
    website_url: ''
  });

  useEffect(() => {
    fetch('/api/public/captcha-config')
      .then(r => r.json())
      .then(data => setCaptchaConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!captchaConfig?.siteKey || step !== 4) return;

    const scriptId = 'captcha-script';
    if (document.getElementById(scriptId)) return;

    let src = '';
    if (captchaConfig.provider === 'turnstile') {
      src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    } else if (captchaConfig.provider === 'hcaptcha') {
      src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
    }

    if (!src) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (captchaContainerRef.current && captchaConfig.provider === 'turnstile' && (window as any).turnstile) {
        (window as any).turnstile.render(captchaContainerRef.current, {
          sitekey: captchaConfig.siteKey,
          callback: (token: string) => setCaptchaToken(token),
        });
      }
    };
    document.head.appendChild(script);
  }, [captchaConfig, step]);

  const calculateAge = (birthDateStr: string): number => {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleCEPBlur = async () => {
    const cleanCEP = formData.cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    try {
      const res = await fetch(`/api/address/cep/${cleanCEP}`);
      if (res.ok) {
        const address = await res.json();
        setFormData(prev => ({
          ...prev,
          logradouro: address.logradouro || prev.logradouro,
          bairro: address.bairro || prev.bairro,
          cidade: address.cidade || prev.cidade,
          estado: address.estado || prev.estado
        }));
      }
    } catch {
      // fill manually
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password || formData.password !== formData.confirmPassword) {
        setError('Preencha os campos corretamente. A senha e confirmacao devem coincidir.');
        return;
      }
    } else if (step === 2) {
      if (!formData.fullName || !formData.birthDate || !formData.cpf) {
        setError('Preencha todos os dados pessoais.');
        return;
      }
    } else if (step === 3) {
      if (!formData.cep || !formData.logradouro || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
        setError('Preencha o endereco completo.');
        return;
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.termsAccepted) {
      setError('Voce precisa aceitar os termos de uso para prosseguir.');
      return;
    }

    if (captchaConfig?.required && !captchaToken) {
      setError('Complete o captcha antes de prosseguir.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          captchaToken,
          formStartTime
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.otpRequired) {
          window.location.href = `/verificar-email?accountId=${data.accountId}&email=${encodeURIComponent(data.emailMasked)}`;
        } else {
          window.location.href = '/entrar';
        }
      } else {
        setError(data.error?.message || 'Falha ao realizar cadastro.');
        setSubmitting(false);
      }
    } catch {
      setError('Falha ao comunicar com o servidor da API.');
      setSubmitting(false);
    }
  };

  if (captchaConfig && !captchaConfig.registrationEnabled) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-amber-500/30 rounded-lg p-8 shadow-xl text-center">
          <h2 className="text-xl font-black text-amber-400 mb-4 tracking-wider uppercase">Cadastro Indisponivel</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">O cadastro esta temporariamente em manutencao. Tente novamente mais tarde.</p>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm font-bold uppercase tracking-wider">Voltar ao Inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
      <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Universo Priston Tale</span>
          <h1 className="text-3xl font-black uppercase tracking-wider mt-2">Criar Conta UPT</h1>
          <div className="flex justify-between mt-6 max-w-xs mx-auto">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-sm ${step === s ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : step > s ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'border-zinc-800 text-zinc-600'}`}>{s}</div>
                {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-zinc-800' : 'bg-zinc-900'}`} />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-sm font-semibold" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {/* Honeypot */}
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <input type="text" name="website_url" value={formData.website_url} onChange={handleChange} tabIndex={-1} autoComplete="off" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-zinc-800 pb-2 text-zinc-200 uppercase tracking-wide">Etapa 1 - Credenciais da Conta</h2>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Nome da conta</label>
                <input name="username" value={formData.username} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" placeholder="Ex: player123" required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">E-mail</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" placeholder="Ex: seuemail@provedor.com" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Senha</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Confirmar Senha</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-zinc-800 pb-2 text-zinc-200 uppercase tracking-wide">Etapa 2 - Dados Pessoais</h2>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Nome Completo</label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" placeholder="Ex: Jose da Silva" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Data de Nascimento</label>
                  <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">CPF (Somente numeros)</label>
                  <input name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" placeholder="Ex: 00000000000" maxLength={11} required />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-zinc-800 pb-2 text-zinc-200 uppercase tracking-wide">Etapa 3 - Endereco de Residencia</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">CEP</label>
                  <input name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCEPBlur} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" placeholder="00000000" maxLength={8} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Logradouro</label>
                  <input name="logradouro" value={formData.logradouro} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Numero</label>
                  <input name="numero" value={formData.numero} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Complemento (Opcional)</label>
                  <input name="complemento" value={formData.complemento} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Bairro</label>
                  <input name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Cidade</label>
                  <input name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">UF</label>
                  <select name="estado" value={formData.estado} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200">
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-zinc-800 pb-2 text-zinc-200 uppercase tracking-wide">Etapa 4 - Regulamentos e Aceite</h2>
              <div className="bg-black/60 border border-zinc-850 rounded p-4 h-48 overflow-y-auto text-xs text-zinc-400 space-y-4 leading-relaxed">
                <p className="font-bold text-zinc-200">Termos de Uso e Politica de Privacidade</p>
                <p>Ao se cadastrar no Universo Priston Tale (UPT), voce concorda com a nossa Politica de Privacidade nos termos da LGPD e concorda em manter uma conduta saudavel dentro das regras oficiais do jogo.</p>
              </div>

              {formData.birthDate && calculateAge(formData.birthDate) < 12 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded space-y-4">
                  <p className="text-xs font-semibold text-amber-300">Responsavel Legal obrigatorio para menores de 12 anos:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Nome do Responsavel</label>
                      <input name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 focus:outline-none focus:border-emerald-500 text-zinc-200 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">CPF do Responsavel</label>
                      <input name="guardianCPF" value={formData.guardianCPF} onChange={handleChange} className="w-full bg-black border border-zinc-800 rounded px-4 py-2 focus:outline-none focus:border-emerald-500 text-zinc-200 text-sm" placeholder="Apenas numeros" maxLength={11} required />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm text-zinc-300">
                  <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1" required />
                  <span>Li e aceito todos os Termos de Uso, EULA e Politica de Privacidade do UPT.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-zinc-300">
                  <input type="checkbox" name="marketingAccepted" checked={formData.marketingAccepted} onChange={handleChange} className="mt-1" />
                  <span>Aceito receber e-mails informativos, atualizacoes e novidades do servidor (Opcional).</span>
                </label>
              </div>

              {captchaConfig?.siteKey && (
                <div ref={captchaContainerRef} className="flex justify-center" />
              )}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded transition">Voltar</button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button type="button" onClick={nextStep} className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-100 font-bold uppercase tracking-wider text-xs rounded transition">Avancar</button>
            ) : (
              <button type="submit" disabled={submitting} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase tracking-wider text-xs rounded transition shadow-lg shadow-emerald-500/10 disabled:opacity-50">
                {submitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
