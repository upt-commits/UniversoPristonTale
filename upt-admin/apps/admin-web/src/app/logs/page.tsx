"use client";

import { useEffect, useState } from "react";
import { Search, FileText, MessageSquare } from "lucide-react";

type ChatLog = {
  Sender: string;
  Receiver: string;
  Message: string;
  ChatType: number;
  Timestamp: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/v1/logs/chat")
      .then((res) => res.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.Sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.Message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Logs Globais de Chat</h1>
        <p className="mt-1 text-slate-400">Consulte e pesquise mensagens enviadas no jogo em tempo real.</p>
      </div>

      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-6 shadow-sm backdrop-blur flex flex-col gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por jogador ou mensagem..."
            className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Horário</th>
                <th className="px-4 py-3">Remetente (Sender)</th>
                <th className="px-4 py-3">Mensagem</th>
                <th className="px-4 py-3">Destinatário</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} className="border-b border-dark-800/50 hover:bg-dark-800/50 transition-colors">
                  <td className="px-4 py-4 text-slate-400 font-mono text-xs">
                    {new Date(log.Timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 font-medium text-brand-400 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {log.Sender}
                  </td>
                  <td className="px-4 py-4 text-white font-medium">{log.Message}</td>
                  <td className="px-4 py-4 text-slate-300">{log.Receiver || "Global"}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Nenhum registro de log encontrado.
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
