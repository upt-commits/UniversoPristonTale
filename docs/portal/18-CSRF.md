# 18 — Protecao CSRF

## Visao geral

Endpoints de mutacao autenticados sao protegidos por token CSRF (Cross-Site Request Forgery). O token e gerado pelo servidor, armazenado como hash na sessao, e validado a cada requisicao de mutacao.

## Fluxo

1. Frontend (autenticado) faz `GET /api/auth/csrf`
2. API gera token aleatorio (`crypto.randomBytes(32)`)
3. Hash SHA-256 do token e salvo em `PlayerSessions.CSRFTokenHash`
4. Token (nao o hash) retornado ao frontend no JSON response
5. Frontend envia token no header `X-CSRF-Token` em requisicoes de mutacao
6. Middleware `requireCSRF` valida:
   - Origin/Referer contra lista de origens permitidas
   - Token CSRF contra hash armazenado na sessao

## Seguranca

- Token CSRF **nao** e armazenado em localStorage ou sessionStorage
- Hash armazenado no banco, nao no cookie
- Validacao de Origin/Referer como camada adicional
- Token e one-time: novo token gerado a cada solicitacao
- Origens permitidas: `https://universopt.com.br`, `https://www.universopt.com.br`
- Em dev: `http://localhost:3000`, `http://127.0.0.1:3000` adicionados

## Endpoints protegidos

| Metodo | Rota | Middleware |
|--------|------|-----------|
| PATCH | `/api/player/me` | `requireAuth` + `requireCSRF` |

## Endpoints publicos (sem CSRF)

Endpoints de autenticacao (login, register, verify-email, resend) nao exigem CSRF pois:
- Login/register sao protegidos por rate limiting e CAPTCHA
- Verify/resend tem rate limiting proprio e validam dados especificos

## Codigos de erro

| Codigo | Descricao |
|--------|-----------|
| UPT-CSRF-001 | Sessao nao autenticada (ao gerar token) |
| UPT-CSRF-002 | Origem nao autorizada |
| UPT-CSRF-003 | Token CSRF ausente no header |
| UPT-CSRF-004 | Sessao nao autenticada (ao validar) |
| UPT-CSRF-005 | Token CSRF invalido ou expirado |

## Arquivos

- `api/src/middleware/csrf.ts` — Geracao e validacao de token CSRF
- `api/src/routes/index.ts` — Aplicacao do middleware nos endpoints
