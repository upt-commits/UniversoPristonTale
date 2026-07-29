"use client";

import { useState } from "react";
import { Megaphone, Crosshair, Sparkles, AlertTriangle } from "lucide-react";

export default function LiveServerPage() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastColor, setBroadcastColor] = useState("system"); // system, alert, event
  
  const [spawnMonster, setSpawnMonster] = useState("");
  const [spawnAmount, setSpawnAmount] = useState("1");
  const [spawnMap, setSpawnMap] = useState("Ricarten");

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("http://localhost:3001/api/server/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: broadcastMessage, color: broadcastColor }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Mensagem Global Enviada!");
          setBroadcastMessage("");
        }
      });
  };

  const handleSpawn = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("http://localhost:3001/api/server/spawn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monsterId: spawnMonster, amount: spawnAmount, mapId: spawnMap }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Monstros spawnados com sucesso!");
        }
      });
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-brand-500" />
          Live Server Control
        </h1>
        <p className="mt-1 text-slate-400">Controle eventos ao vivo e notifique jogadores sem reiniciar o servidor.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Painel de Broadcast */}
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
          <div className="mb-6 flex items-center gap-3 border-b border-dark-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Aviso Global (Broadcast)</h2>
          </div>
          
          <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tipo de Mensagem</label>
              <select
                className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                value={broadcastColor}
                onChange={(e) => setBroadcastColor(e.target.value)}
              >
                <option value="system">Sistema (Azul)</option>
                <option value="alert">Alerta (Vermelho)</option>
                <option value="event">Evento (Dourado)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Mensagem</label>
              <textarea
                className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none min-h-[100px]"
                placeholder="Digite a mensagem para todos os jogadores..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-500"
            >
              <Megaphone className="h-4 w-4" />
              Enviar Mensagem
            </button>
          </form>
        </div>

        {/* Painel de Spawn */}
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
          <div className="mb-6 flex items-center gap-3 border-b border-dark-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <Crosshair className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Invasão (Spawn Remoto)</h2>
          </div>
          
          <form onSubmit={handleSpawn} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Monstro / Boss</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="Ex: Babel"
                  value={spawnMonster}
                  onChange={(e) => setSpawnMonster(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                  value={spawnAmount}
                  onChange={(e) => setSpawnAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Mapa Destino</label>
              <select
                className="w-full rounded-lg border border-dark-700 bg-dark-800 p-2.5 text-white focus:border-brand-500 focus:outline-none"
                value={spawnMap}
                onChange={(e) => setSpawnMap(e.target.value)}
              >
                <option value="Ricarten">Ricarten</option>
                <option value="Navisko">Navisko</option>
                <option value="Pillai">Pillai</option>
                <option value="BlessCastle">Bless Castle</option>
              </select>
            </div>
            
            <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20 mt-2">
               <div className="flex gap-3">
                 <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                 <p className="text-sm text-red-200">Aviso: Spawnar bosses (como Babel ou Valento) em mapas pacíficos pode causar morte em massa e frustração de jogadores low level. Proceda com cautela.</p>
               </div>
            </div>
            
            <button
              type="submit"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-500"
            >
              <Crosshair className="h-4 w-4" />
              Executar Invasão
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
