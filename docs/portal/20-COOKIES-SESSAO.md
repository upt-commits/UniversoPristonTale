# 20 — Cookies e Sessao

## Visao geral

A autenticacao utiliza cookies HttpOnly server-side. **Nao existe token em localStorage. Nao existe token em sessionStorage. Nao existe `upt_session_token` no frontend. O login nao retorna token no JSON.**

## Cookie de sessao

| Atributo | Valor | Descricao |
|----------|-------|-----------|
| Nome | `upt_sid` (configuravel) | Identificador do cookie |
| HttpOnly | `true` | Inacessivel via JavaScript |
| Secure | `true` em producao | Apenas HTTPS |
| SameSite | `Lax` | Protecao contra CSRF basico |
| Path | `/` | Disponivel em todas as rotas |
| MaxAge | 1440 min (configuravel) | Duracao da sessao |

## Fluxo de autenticacao

1. `POST /api/auth/login` — valida credenciais
2. Gera token aleatorio: `crypto.randomBytes(32).toString('hex')`
3. Armazena hash SHA-256 do token em `PlayerSessions`
4. Define cookie com `res.cookie()` (token em texto, nao o hash)
5. Frontend usa `credentials: 'include'` em todas as requisicoes
6. Middleware `requireAuth` le o cookie, faz hash, valida contra o banco

## Logout

1. `POST /api/auth/logout`
2. Cookie limpo com `res.clearCookie()`
3. Sessao marcada como revogada (`RevokedAt = GETUTCDATE()`)
4. Log de auditoria registrado

## Configuracao independente de NODE_ENV

As configuracoes de cookie sao controladas por variaveis de ambiente dedicadas, **nao** por `NODE_ENV`:

```
COOKIE_SECURE=true         # Nao depende de NODE_ENV
COOKIE_SAME_SITE=lax       # Nao depende de NODE_ENV
COOKIE_NAME=upt_sid        # Nome do cookie
SESSION_TTL_MINUTES=1440   # Duracao em minutos
```

Em producao, `validateProductionConfig()` exige `COOKIE_SECURE=true`.

## Trust Proxy

O IIS atua como reverse proxy. A configuracao `trust proxy` garante que `req.ip` retorna o IP real do cliente, nao o do IIS.

```
TRUST_PROXY=1    # Confia no primeiro proxy (IIS)
```

## Seguranca da sessao

- Token armazenado no banco como SHA-256 hash
- Token **nunca** logado em texto puro
- Sessoes expiradas sao rejeitadas pela validacao de `ExpiresAt`
- Sessoes revogadas sao rejeitadas pela validacao de `RevokedAt`
- IP e User-Agent registrados para auditoria

## Migracoes de seguranca aplicadas

O frontend foi auditado para remover toda referencia insegura:
- `app/entrar/page.tsx` — usa `credentials: 'include'`, sem localStorage
- `app/conta/page.tsx` — usa `credentials: 'include'`, logout via POST
- `app/criar-conta/page.tsx` — usa `credentials: 'include'`
- `app/verificar-email/page.tsx` — usa `credentials: 'include'`

Validacao por grep:
```bash
rg -n "localStorage|sessionStorage|upt_session_token|Authorization.*Bearer" app api
# Resultado: 0 matches
```

## Arquivos

- `api/src/routes/index.ts` — Login, logout, requireAuth, setSessionCookie
- `api/src/server.ts` — Trust proxy, cookie-parser
- `api/src/config.ts` — Configuracao centralizada de cookies
- `app/conta/page.tsx` — Dashboard com auth via cookie
- `app/entrar/page.tsx` — Login com credentials: include
