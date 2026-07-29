# FASE 0 — Inventário do Repositório

## Estrutura de repos encontrada

| Path                                              | Git?  | Remote                   | Branch    | Último commit                                    |
|---------------------------------------------------|-------|--------------------------|-----------|--------------------------------------------------|
| `D:\Priston Tale UPT de volta`                    | Não   | —                        | —         | —                                                |
| `D:\...\PristonTale-EU-main-master`               | Sim   | (não checado nesta fase) | master    | `76aaf71 Lote 2: Interface Visual Base ADM/GM`   |
| `D:\...\PristonTale-EU-main-master\UPTServerManager\imgui` | Sim | (submódulo)  | —         | —                                                |
| `D:\...\_WEB_UPT\admin`                           | **Sim** | **vazio (sem remote)** | master    | `2047414 Initial commit from Create Next App`    |
| `D:\...\_WEB_UPT\api`                             | **Não** | —                       | —         | —                                                |

`git status` do `_WEB_UPT/admin`:

- Modified: `package-lock.json`, `package.json`, `src/app/globals.css`,
  `src/app/layout.tsx`, `src/app/page.tsx`
- Untracked: `src/app/accounts/`, `src/app/drops/`, `src/app/server/`,
  `src/app/settings/`, `src/components/`

O commit `b76e9fa` mencionado no prompt **não existe** neste repositório.
Nada aponta pra `github.com/upt-commits/UniversoPristonTale.git`.

## Framework, versão e ferramentas

### `_WEB_UPT/admin/` (Next.js)

- **Next**: `16.2.11` (major beta/experimental — o próprio `AGENTS.md`
  avisa que "This is NOT the Next.js you know")
- **React**: `19.2.4`
- **TypeScript**: `^5`
- **Tailwind CSS**: `^4`
- **ESLint**: `^9` com `eslint-config-next`
- **PostCSS**: com `@tailwindcss/postcss`
- **Fonte**: `Inter` via `next/font/google`
- **Ícones**: `lucide-react`
- **Scripts NPM**: `dev`, `build`, `start`, `lint`

### `_WEB_UPT/api/` (Express)

- **Express**: `^5.2.1`
- **CORS**: `^2.8.6`
- **dotenv**: `^17.4.2`
- **TypeScript**: `^7.0.2` (versão beta — TS 7 ainda não foi lançado
  estável; verificar se é typo ou de fato beta)
- **nodemon**, **ts-node** em dev
- **Type**: `commonjs`
- **Sem `dev`/`build`/`start` scripts** — só um `test` placeholder que
  falha propositalmente

## Componentes React implementados no admin

| Path                                    | Papel                                                              |
|-----------------------------------------|--------------------------------------------------------------------|
| `src/app/layout.tsx`                    | Root layout — html/body escuro, sidebar + main scroll              |
| `src/app/page.tsx`                      | Dashboard (Players Online, GMs, CPU, RAM, gráfico "Mock")          |
| `src/app/accounts/page.tsx`             | Lista de players + banir/desbanir via `POST /api/players/:id/ban`  |
| `src/app/server/page.tsx`               | Broadcast global + spawn de monstro                                |
| `src/app/settings/page.tsx`             | (não inspecionado nesta fase)                                      |
| `src/app/drops/page.tsx`                | (não inspecionado nesta fase)                                      |
| `src/components/Sidebar.tsx`            | Navegação (Dashboard/Contas/Live Server/Drops/Configurações)       |

## APIs esperadas mas ainda ausentes

Os componentes fazem `fetch` para as URLs abaixo — nenhuma implementada no
`_WEB_UPT/api/`:

- `GET  http://localhost:3001/api/dashboard/stats`
- `GET  http://localhost:3001/api/players`
- `POST http://localhost:3001/api/players/:id/ban`
- `POST http://localhost:3001/api/server/broadcast`
- `POST http://localhost:3001/api/server/spawn` (inferido)

## Auditoria anterior encontrada

`_AUDITORIA_UPT/SITE_PORTAL_100_ONLINE/` (Fase A prévia):

- `RELATORIO_FASE_A_SITE_PORTAL_UPT.md`
- `ARQUITETURA_REAL_SITE_PORTAL_UPT.md`
- `CHECKLIST_37_ENTREGAVEIS_PORTAL_UPT.md`
- `CONTRATOS_INTEGRACAO_PORTAL_UPT.md`
- `FEATURE_FLAGS_SITE_PORTAL_UPT.md`
- `INVENTARIO_PROJETOS_WEB_APIS_SERVICOS_BANCOS.csv`
- `MATRIZ_BLOQUEADORES_FASE_A_SITE_PORTAL_UPT.md`
- `MATRIZ_SEGURANCA_OWASP_LGPD_PORTAL_UPT.md`
- `PLANO_PROXIMA_FASE_CIRURGICO.md`
- `RUNBOOK_FASE_A_SITE_PORTAL_UPT.md`
- `migrations/` (001 no-op + rollback)
- `tests/VALIDAR_FASE_A_SITE_PORTAL_UPT.ps1`
- `checkpoint/CHECKPOINT_PRE_FASE_A_*`

Essa auditoria concluiu (cito): "Não há base segura para implementar cadastro,
login web, UPT Shop, tickets, CMS, downloads, rankings públicos, RBAC
administrativo, Mercado Pago ou ponte com `UPTServerManager.exe` sem o prompt
principal e sem contrato real de schemas/endpoints."

## Bancos e binários reais que o portal precisaria consumir (já mapeados)

- `UserDB` (contas, personagens) — usado pelo `Login Server`
- `GameDB` (itens, mapas, monstros, quests, NPCs)
- `ClanDB` (clãs) — usado pelo backend ASP `Files/ClanSystem/Clan/*.asp`
  (agora **online** após esta sessão — ver `_AUDITORIA_UPT/CLANS_100_ONLINE/`)
- `ChatDB` (chats/logs)
- `LogDB`, `EventDB`, `ItemDB`, `SkillDB`, `SkillDBNew`, `ServerDB`
- `Server.exe` (Login/Game) — carrega `server.dll`
- `UPTServerManager.exe` (não integrado ao portal ainda)
