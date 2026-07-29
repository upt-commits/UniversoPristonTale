"use client";

import { useEffect, useState } from "react";
import { Users, Server, ShieldCheck, Activity } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ onlinePlayers: 0, activeGMs: 0, cpuUsage: 0, ramUsage: 0, dailyRevenue: 0 });

  useEffect(() => {
    fetch("http://localhost:3001/api/dashboard/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">Bem-vindo ao Painel Administrativo UPT.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-500 border border-green-500/20">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          Servidor Online
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Players Online</p>
              <h3 className="text-2xl font-bold text-white">{stats.onlinePlayers}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">GMs Ativos</p>
              <h3 className="text-2xl font-bold text-white">{stats.activeGMs}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Uso RAM (GameServer)</p>
              <h3 className="text-2xl font-bold text-white">{stats.ramUsage} MB</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Uso CPU</p>
              <h3 className="text-2xl font-bold text-white">{stats.cpuUsage}%</h3>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-8 rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur min-h-[400px] flex items-center justify-center">
         <p className="text-slate-500">Gráfico de Atividade (Mock)</p>
      </div>

    </div>
  );
}
