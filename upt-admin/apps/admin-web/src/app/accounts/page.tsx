"use client";

import { useEffect, useState } from "react";
import { Search, Ban, Unlock, Edit, ShieldAlert, User, Star } from "lucide-react";

type Player = {
  ID: number;
  AccountName: string;
  Email: string;
  CreatedAt: string;
  IsBanned: number;
};

type Character = {
  Name: string;
  JobCode: number;
  Level: number;
  Experience: number;
  MapNum: number;
  X: number;
  Z: number;
};

export default function AccountsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    // API endpoint mapeado no backend NestJS local
    fetch("http://localhost:3001/api/v1/players")
      .then((res) => res.json())
      .then((data) => setPlayers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const loadCharacters = (accountName: string) => {
    setSelectedAccount(accountName);
    fetch(`http://localhost:3001/api/v1/players/${accountName}/characters`)
      .then((res) => res.json())
      .then((data) => setCharacters(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const filteredPlayers = players.filter(
    (p) => p.AccountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de Contas</h1>
        <p className="mt-1 text-slate-400">Consulte informações das contas e personagens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Contas */}
        <div className="lg:col-span-2 rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur flex flex-col gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por conta..."
              className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dark-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.ID}
                    className={`border-b border-dark-800/50 hover:bg-dark-800/50 transition-colors cursor-pointer ${
                      selectedAccount === player.AccountName ? "bg-dark-800/70" : ""
                    }`}
                    onClick={() => loadCharacters(player.AccountName)}
                  >
                    <td className="px-4 py-4 font-medium text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-brand-400" />
                      {player.AccountName}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{player.Email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          player.IsBanned
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {player.IsBanned ? "Banido" : "Ativo"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
                        Ver Personagens
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma conta encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhes de Personagens */}
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-white">Personagens da Conta</h2>
          {selectedAccount ? (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-dark-800/50 rounded-lg border border-dark-700 text-sm text-slate-300">
                Conta selecionada: <span className="font-bold text-white">{selectedAccount}</span>
              </div>
              <div className="flex flex-col gap-3">
                {characters.map((char) => (
                  <div
                    key={char.Name}
                    className="p-4 bg-dark-800 rounded-lg border border-dark-700 flex flex-col gap-2 hover:border-brand-500 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {char.Name}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-brand-500/15 text-brand-400 rounded">
                        Lvl {char.Level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-col gap-1">
                      <div>Classe (JobCode): <span className="text-slate-300 font-mono">{char.JobCode}</span></div>
                      <div>Mapa Atual: <span className="text-slate-300 font-mono">{char.MapNum}</span></div>
                      <div>Coordenadas: <span className="text-slate-300 font-mono">({char.X}, {char.Z})</span></div>
                    </div>
                  </div>
                ))}
                {characters.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Nenhum personagem nesta conta.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              Selecione uma conta na tabela ao lado para visualizar os personagens.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
