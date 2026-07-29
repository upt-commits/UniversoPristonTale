# 16 — CAPTCHA (Cloudflare Turnstile)

## Visao geral

O cadastro exige validacao CAPTCHA server-to-server para prevenir bots. O provedor padrao e Cloudflare Turnstile, mas o sistema suporta hCaptcha e reCAPTCHA v2.

## Fluxo

1. Frontend carrega script do Turnstile no Step 4 do cadastro
2. Widget renderiza e usuario resolve o desafio
3. Token enviado no body do POST `/api/auth/register` como `captchaToken`
4. API valida token server-to-server com Cloudflare (5s timeout)
5. Validacao de hostname contra lista de origens permitidas
6. Rejeicao se o token for invalido, expirado ou de hostname nao autorizado

## Seguranca

- Chave secreta (`CAPTCHA_SECRET_KEY`) **nunca** entra no bundle do frontend
- Validacao **sempre** server-to-server, nunca confia no frontend
- Bypass em dev **somente** quando: `APP_ENV != production` AND `CAPTCHA_REQUIRED=false` AND `ALLOW_DEV_CAPTCHA_BYPASS=true`
- **Nao** cria bypass de producao
- Hostnames permitidos: `universopt.com.br`, `www.universopt.com.br` (+ `localhost` em dev)

## Anti-bot adicional

Alem do CAPTCHA, o cadastro implementa:

- **Honeypot**: campo oculto `website_url` — se preenchido, rejeita
- **Timing**: `formStartTime` — rejeita se formulario enviado em menos de 3 segundos

## Configuracao (.env)

```
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=0x... (chave publica do Turnstile)
CAPTCHA_SECRET_KEY=0x... (chave secreta do Turnstile)
CAPTCHA_REQUIRED=true
ALLOW_DEV_CAPTCHA_BYPASS=false
```

## Comportamento sem CAPTCHA

Se `CAPTCHA_REQUIRED=true` mas `CAPTCHA_SITE_KEY` nao esta configurado em producao, o sistema desabilita o cadastro automaticamente (`REGISTRATION_ENABLED=false`) e emite um aviso no log de inicializacao.

## Provedores suportados

| Provedor | URL de verificacao |
|----------|-------------------|
| Turnstile | `https://challenges.cloudflare.com/turnstile/v0/siteverify` |
| hCaptcha | `https://hcaptcha.com/siteverify` |
| reCAPTCHA | `https://www.google.com/recaptcha/api/siteverify` |

## Endpoint publico

`GET /api/public/captcha-config` retorna a configuracao publica (sem chave secreta):

```json
{
  "provider": "turnstile",
  "siteKey": "0x...",
  "required": true,
  "registrationEnabled": true
}
```

## Arquivos

- `api/src/services/captcha.ts` — Validacao server-to-server multi-provedor
- `api/src/config.ts` — Configuracao centralizada
- `app/criar-conta/page.tsx` — Integracao frontend (Step 4)
