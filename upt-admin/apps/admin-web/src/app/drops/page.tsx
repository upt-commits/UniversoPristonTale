"use client";

import { useState } from "react";
import { Search, Plus, Trash2, Edit3, PackageOpen } from "lucide-react";

// Mock data
const mockDrops = [
  { id: 1, monster: "Bhopal", item: "Devine Shield", chance: "0.5%", maxDrop: 1 },
  { id: 2, monster: "Bhopal", item: "Great Sword", chance: "2.0%", maxDrop: 1 },
  { id: 3, monster: "Hopy", item: "Health Potion (S)", chance: "50.0%", maxDrop: 3 },
  { id: 4, monster: "Decoy", item: "Mana Potion (M)", chance: "30.0%", maxDrop: 2 },
  { id: 5, monster: "Babel", item: "Wyvern Armor", chance: "0.1%", maxDrop: 1 },
];

export default function DropsEditorPage() {
  const [drops, setDrops] = useState(mockDrops);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDrops = drops.filter(
    (d) =>
      d.monster.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <PackageOpen className="h-8 w-8 text-brand-500" />
            Editor de Drops
          </h1>
          <p className="mt-1 text-slate-400">Configure as taxas de drop de itens por monstro (GameDB).</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500">
          <Plus className="h-4 w-4" />
          Adicionar Drop
        </button>
      </div>

      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar monstro ou item..."
              className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Monstro</th>
                <th className="px-4 py-3">Item Dropado</th>
                <th className="px-4 py-3">Chance (%)</th>
                <th className="px-4 py-3">Max Qtd</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrops.map((drop) => (
                <tr key={drop.id} className="border-b border-dark-800/50 hover:bg-dark-800/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-white">{drop.monster}</td>
                  <td className="px-4 py-4 text-brand-400">{drop.item}</td>
                  <td className="px-4 py-4 font-mono text-emerald-400">{drop.chance}</td>
                  <td className="px-4 py-4 text-slate-300">{drop.maxDrop}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded p-2 text-slate-400 hover:bg-dark-700 hover:text-white transition-colors" title="Editar">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                        title="Remover"
                        onClick={() => setDrops(drops.filter(d => d.id !== drop.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDrops.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum drop encontrado na pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
