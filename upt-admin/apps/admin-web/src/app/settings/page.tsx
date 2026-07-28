"use client";

import { Save, Server, Shield, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configurações salvas (Mock)");
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações Gerais</h1>
        <p className="mt-1 text-slate-400">Configure os parâmetros do GameServer e do Launcher Oficial.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card GameServer */}
          <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white border-b border-dark-800 pb-3">
              <Server className="h-5 w-5 text-brand-500" />
              Parâmetros do GameServer
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Multiplicador de EXP</label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Multiplicador de Drop</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Level Máximo</label>
                <input
                  type="number"
                  defaultValue="150"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card Launcher e API */}
          <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white border-b border-dark-800 pb-3">
              <Shield className="h-5 w-5 text-purple-500" />
              Segurança e Launcher
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Secret Key (Tickets)</label>
                <input
                  type="password"
                  defaultValue="UPT_SUPER_SECRET_KEY_123!"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Esta chave é usada para gerar e validar o Hash MD5 dos jogadores no Game.exe.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">URL do CDN de Atualizações (Patch)</label>
                <input
                  type="url"
                  defaultValue="https://patch.universopristontale.com/files/"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card Banco de Dados */}
          <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white border-b border-dark-800 pb-3">
              <HardDrive className="h-5 w-5 text-emerald-500" />
              Conexão Banco de Dados (SQL Server)
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Host (IP / Instância)</label>
                <input
                  type="text"
                  placeholder="ex: 127.0.0.1\SQLEXPRESS ou localhost"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Usuário (SA)</label>
                <input
                  type="text"
                  placeholder="sa"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Senha</label>
                <input
                  type="password"
                  placeholder="Senha do Banco de Dados"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-500 shadow-lg shadow-brand-500/20"
            >
              <Save className="h-5 w-5" />
              Salvar Todas as Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
