"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Swords, Settings, ShieldAlert, FileText, Archive, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Gestão de Contas", href: "/accounts", icon: Users },
  { name: "Live Server Control", href: "/server", icon: ShieldAlert },
  { name: "Editor de Drops", href: "/drops", icon: Swords },
  { name: "Logs Globais", href: "/logs", icon: FileText },
  { name: "Baú / Itens", href: "/items", icon: Archive },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-dark-800 bg-dark-900 px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          U
        </div>
        <span className="text-xl font-bold tracking-tight text-white">UPT Admin</span>
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? "bg-brand-600/10 text-brand-500 shadow-[inset_2px_0_0_0_#3b82f6]"
                  : "text-slate-400 hover:bg-dark-800 hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-brand-500" : ""}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-dark-800">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}
