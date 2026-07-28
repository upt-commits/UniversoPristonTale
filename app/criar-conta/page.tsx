"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingAccountId, setPendingAccountId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Captcha State
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [captchaSignature, setCaptchaSignature] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    fullName: '', birthDate: '', cpf: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP',
    termsAccepted: false, guardianName: '', guardianCPF: '', marketingAccepted: false
  });

  // Fetch a new captcha challenge
  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      if (res.ok) {
        const data = await res.json() as any;
        setCaptchaChallenge(data.challenge);
        setCaptchaSignature(data.signature);
      }
    } catch (e) {
      setError('Falha ao carregar o desafio anti-robo. Tente recarregar a pagina.');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

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
        const address = await res.json() as any;
        setFormData(prev => ({
          ...prev,
          logradouro: address.logradouro || prev.logradouro,
          bairro: address.bairro || prev.bairro,
          cidade: address.cidade || prev.cidade,
          estado: address.estado || prev.estado
        }));
      }
    } catch (e) {
      // Ignore CEP fetch error
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
    if (!formData.termsAccepted) {
      setError('Voce precisa aceitar os termos de uso para prosseguir.');
      return;
    }
    if (!captchaAnswer) {
      setError('Responda ao desafio anti-robo.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaAnswer,
          captchaSignature
        })
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        setPendingAccountId(data.accountId);
        setIsVerifying(true);
        setError('');
      } else {
        setError(data.error?.message || 'Falha ao realizar cadastro.');
        fetchCaptcha(); // Refresh captcha
      }
    } catch (err) {
      setError('Falha ao comunicar com o servidor da API.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: pendingAccountId,
          code: verificationCode
        })
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        setSuccess(true);
        setIsVerifying(false);
        setError('');
      } else {
        setError(data.error?.message || 'Codigo incorreto ou expirado.');
      }
    } catch (err) {
      setError('Falha ao comunicar com o servidor da API.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-emerald-500/30 rounded-lg p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-400 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-black text-emerald-400 mb-4 tracking-wider">CONTA ATIVADA!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">Sua conta do portal e do jogo foi registrada e validada com sucesso. Voce ja pode entrar no painel e no Game.exe.</p>
          <Link href="/entrar" className="block w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-100 rounded font-bold uppercase tracking-wider text-sm transition">
            Acessar Painel
          </Link>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Validação de Conta</span>
            <h1 className="text-2xl font-black uppercase tracking-wider mt-1">Insira o código</h1>
            <p className="text-zinc-400 text-xs mt-2">Um codigo de validacao de 6 digitos foi enviado ao seu e-mail cadastrado.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">Código de 6 dígitos</label>
              <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-4 py-3 focus:outline-none focus:border-emerald-500 text-zinc-200 text-center tracking-widest text-lg font-black" placeholder="000000" maxLength={6} required />
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase tracking-wider text-xs rounded transition shadow-lg shadow-emerald-500/10">
              Verificar e Ativar Conta
            </button>
          </form>
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
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-sm font-semibold">
            {error}
          </div>
        )}

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
              <div className="bg-black/60 border border-zinc-850 rounded p-4 h-32 overflow-y-auto text-xs text-zinc-400 space-y-4 leading-relaxed">
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

              {/* Anti-Robot / Challenge system */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded space-y-2">
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1">Verificacao Anti-Robo</label>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-bold text-emerald-400 bg-emerald-500/5 px-3 py-2 border border-emerald-500/10 rounded">{captchaChallenge || 'Carregando desafio...'}</span>
                  <input value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} className="w-24 bg-black border border-zinc-800 rounded px-3 py-2 text-center text-zinc-200 focus:outline-none focus:border-emerald-500" placeholder="Resposta" required />
                  <button type="button" onClick={fetchCaptcha} className="text-xs text-zinc-500 hover:text-emerald-400 font-bold">Atualizar</button>
                </div>
              </div>

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
              <button type="submit" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase tracking-wider text-xs rounded transition shadow-lg shadow-emerald-500/10">Finalizar Cadastro</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
