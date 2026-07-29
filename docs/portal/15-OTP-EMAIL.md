# 15 — Verificacao de E-mail via OTP

## Visao geral

O sistema utiliza codigos OTP (One-Time Password) de 6 digitos para verificar o e-mail do usuario apos o cadastro. A conta permanece inativa (`Active=0`, `EmailVerified=0`) ate a verificacao ser concluida.

## Fluxo

1. Usuario completa cadastro → conta criada com `Active=0`
2. API gera OTP via `crypto.randomBytes(4)`, formata em 6 digitos
3. OTP e armazenado como HMAC-SHA256 na tabela `EmailVerificationOTP`
4. E-mail enviado via nodemailer com o codigo em texto e HTML
5. Usuario digita o codigo na pagina `/verificar-email`
6. API valida usando `crypto.timingSafeEqual` (protecao contra timing attacks)
7. Sucesso: `EmailVerified=1` no UPTPortal + `Active=1` no UserDB (transacao atomica)

## Seguranca

- OTP **nunca** armazenado em texto puro — apenas hash HMAC-SHA256
- OTP **nunca** aparece em logs de producao
- OTP **nao** e enviado em query string
- Hash **nao** e enviado ao navegador
- Maximo de 5 tentativas por codigo (`MaxAttempts`)
- Expiracao configuravel (padrao: 10 minutos)
- Cooldown de reenvio: 60 segundos
- Limite por hora: 5 reenvios
- Rate limiting no endpoint: 20 req/15min (verify), 10 req/hora (resend)

## Tabelas

- `EmailVerificationOTP`: ID, AccountID, OTPHash, Email, CreatedAt, ExpiresAt, UsedAt, Attempts, MaxAttempts, IPAddress, UserAgent
- `OTPResendLog`: ID, AccountID, SentAt, IPAddress

## Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/auth/verify-email` | Valida codigo OTP |
| POST | `/api/auth/resend-verification` | Reenvia codigo OTP |

## Configuracao (.env)

```
OTP_ENABLED=true
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_RESENDS_PER_HOUR=5
SMTP_HOST=smtp.provedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario@dominio.com
SMTP_PASSWORD=CHANGE_ME
SMTP_FROM=noreply@universopt.com.br
```

## Comportamento sem SMTP

Se o SMTP nao estiver configurado, o cadastro ainda funciona mas sem verificacao de e-mail. Em producao, o sistema desabilita o cadastro automaticamente se OTP esta habilitado mas SMTP nao esta configurado.

## Arquivos

- `api/src/services/otp.ts` — Geracao, hash, criacao, verificacao, ativacao
- `api/src/services/email.ts` — Transporte SMTP, envio de OTP, mascara de e-mail
- `api/src/config.ts` — Configuracao centralizada
- `app/verificar-email/page.tsx` — Pagina de verificacao no portal
