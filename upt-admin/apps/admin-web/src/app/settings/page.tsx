import { HardDrive, LockKeyhole, Server, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações seguras</h1>
        <p className="mt-1 text-slate-400">Estado de integração do painel administrativo.</p>
      </header>
      <div className="max-w-4xl space-y-6">
        {[
          [Server, "Servidor do jogo", "Parâmetros permanecem somente leitura até existir uma operação autenticada, auditada e reversível no agente local."],
          [Shield, "Segredos", "Chaves e segredos são configurados exclusivamente no servidor e nunca são enviados ao navegador."],
          [HardDrive, "SQL Server", "A conexão usa identidade de aplicação com menor privilégio e variáveis protegidas no servidor."],
          [LockKeyhole, "Ações sensíveis", "Reinício, restore, exclusão e entrega de itens permanecem indisponíveis sem MFA, permissão e dupla confirmação."],
        ].map(([Icon, title, body]) => {
          const Component = Icon as typeof Server;
          return (
            <section key={String(title)} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white"><Component className="h-5 w-5 text-emerald-400" />{String(title)}</h2>
              <p className="text-sm leading-6 text-slate-300">{String(body)}</p>
            </section>
          );
        })}
      </div>
    </main>
  );
}
