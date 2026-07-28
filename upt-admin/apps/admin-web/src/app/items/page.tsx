"use client";

import { useEffect, useState } from "react";
import { Search, Database, Archive } from "lucide-react";

type Item = {
  ItemName: string;
  Quantity: number;
  Level: number;
  Chk1: number;
  Chk2: number;
  StorageType: number;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = () => {
    if (!searchUser) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/v1/items/warehouse/${searchUser}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Visualizador de Itens (Armazém)</h1>
        <p className="mt-1 text-slate-400">Consulte o conteúdo dos baús e itens salvos de uma conta.</p>
      </div>

      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur flex flex-col gap-4">
        <div className="flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Digite a conta do jogador..."
              className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>
          <button
            onClick={fetchItems}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-brand-500/20"
          >
            Buscar Baú
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Buscando itens na base SQL...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dark-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3">Level Requerido</th>
                  <th className="px-4 py-3">Assinatura Chk1</th>
                  <th className="px-4 py-3">Assinatura Chk2</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-dark-800/50 hover:bg-dark-800/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-white flex items-center gap-2">
                      <Archive className="h-4 w-4 text-purple-400" />
                      {item.ItemName}
                    </td>
                    <td className="px-4 py-4 text-brand-400 font-bold">{item.Quantity}</td>
                    <td className="px-4 py-4 text-slate-300">{item.Level}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">{item.Chk1}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">{item.Chk2}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhum item carregado. Digite a conta e realize a pesquisa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
