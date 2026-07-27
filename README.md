# Universo Priston Tale

Fonte unificada do portal público do UPT, preparada para
`https://www.universopt.com.br`.

O projeto preserva a home medieval já publicada e reúne as superfícies públicas
do jogador sem inventar dados do jogo. Integrações que ainda dependem do gateway
da VM permanecem visíveis, explicadas e bloqueadas.

## Portal incluído

- apresentação cinematográfica do servidor;
- cadastro e login preparados, mas sem coleta antes da API real;
- painel do jogador sem personagens ou saldos simulados;
- download oficial condicionado a versão, tamanho e SHA-256;
- notícias, eventos, rankings, clãs, UPT Shop e suporte;
- status separado por serviço, sem declarar o jogo online por suposição;
- página pública de segurança;
- layout responsivo, acessível e otimizado para leitura;
- metadados sociais, robots e sitemap;
- testes de renderização para todas as rotas públicas.

## Rotas

| Rota | Finalidade | Estado |
| --- | --- | --- |
| `/` | Home pública | Implementada |
| `/entrar` e `/criar-conta` | Autenticação do jogo | Interface segura; gateway pendente |
| `/conta` | Painel do jogador | Estrutura; sessão e dados pendentes |
| `/download` | Launcher oficial | Estrutura; artefato assinado pendente |
| `/noticias` | Conteúdo oficial | Estrutura; CMS pendente |
| `/eventos` | Agenda e Bless Castle | Estrutura; servidor/CMS pendentes |
| `/rankings` | Nível, classe, PvP, clãs e Bellatra | Estrutura; leitura segura pendente |
| `/clas` | Sistema de clãs | Estrutura; ClanDB legado pendente |
| `/shop` | UPT Coins e pedidos | Estrutura; pagamento/worker pendentes |
| `/suporte` | Ajuda e chamados | Estrutura; tickets pendentes |
| `/status` | Estado de cada serviço | Portal real; health-check do jogo pendente |
| `/seguranca` | Princípios de segurança | Implementada |

## Segurança da integração

O navegador nunca deve acessar SQL Server, Login Server ou Game Server
diretamente. O contrato técnico para o gateway interno está em
[`docs/UPT_GATEWAY_CONTRACT.md`](docs/UPT_GATEWAY_CONTRACT.md).

O ZIP legado recebido foi auditado. A API Express e o painel administrativo
contêm protótipos e dados simulados, por isso não foram incorporados ao portal
público. Consulte
[`docs/IMPORT_AUDIT_20260725.md`](docs/IMPORT_AUDIT_20260725.md).

## Validação

```bash
npm run lint
npm test
```

`npm test` compila o artefato do Sites, valida o Worker e renderiza todas as
rotas públicas. O teste também confirma que os campos de credencial continuam
desabilitados enquanto o gateway não estiver configurado.

## Desenvolvimento

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout and then validates the Sites artifact. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build, validate, and verify the rendered development-preview metadata
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM `default.fetch` export
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build and validation commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
