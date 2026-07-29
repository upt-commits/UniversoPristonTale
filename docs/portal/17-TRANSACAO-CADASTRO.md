# 17 — Transacao Atomica de Cadastro

## Visao geral

O cadastro de conta insere dados em duas databases (`UPTPortal` e `UserDB`) dentro de uma unica transacao SQL Server, garantindo atomicidade. Se qualquer etapa falhar, toda a operacao e revertida.

## Arquitetura

```
UPTPortal (portal)          UserDB (jogo)
├── PlayerAccounts          ├── UserInfo
├── PlayerProfiles          └── (lido por CharacterInfo)
├── GuardianConsents
├── LegalAcceptances
└── SecurityAuditLog
```

Ambas as databases estao na mesma instancia SQL Server e sao acessiveis pelo usuario `UPTApi`.

## Fluxo da transacao

```
BEGIN TRANSACTION
  1. Verificar duplicidade (AccountName, Email, CPF_HMAC em UPTPortal + AccountName em UserDB)
  2. INSERT PlayerAccounts (Active=0, EmailVerified=0)
  3. INSERT PlayerProfiles (CPF criptografado AES-256-GCM, HMAC para dedup)
  4. INSERT GuardianConsents (se menor de 12 anos)
  5. INSERT LegalAcceptances (para cada documento ativo)
  6. INSERT UserDB.dbo.UserInfo (Active=0, senha SHA-256)
  7. UPDATE PlayerAccounts.UserInfoID com o ID retornado
  8. INSERT SecurityAuditLog (REGISTER_SUCCESS)
COMMIT

  9. Enviar OTP por e-mail (fora da transacao)
```

## Queries cross-database

Todas as queries usam nomes qualificados:
- `UPTPortal.dbo.PlayerAccounts`
- `UserDB.dbo.UserInfo`

Isso permite uma unica conexao (`getPortalConnection()`) executar queries em ambas databases.

## Rollback

Se qualquer INSERT falhar:
- `transaction.rollback()` reverte todas as operacoes
- Nenhum dado parcial persiste em nenhuma database
- O OTP nao e enviado (esta fora da transacao)

### Rollback da migration V2

Para reverter a migration V2:

```sql
USE UPTPortal;
DROP TABLE IF EXISTS ServerStatusCache;
DROP TABLE IF EXISTS ServerMaintenance;
DROP TABLE IF EXISTS OTPResendLog;
DROP TABLE IF EXISTS EmailVerificationOTP;
ALTER TABLE PlayerSessions DROP COLUMN IF EXISTS CSRFTokenHash;
DROP INDEX IF EXISTS IX_PlayerAccounts_AccountName ON PlayerAccounts;
DROP INDEX IF EXISTS IX_PlayerAccounts_Email ON PlayerAccounts;
-- (demais indexes listados na migration)

USE UserDB;
DELETE FROM ClassDef WHERE ClassID BETWEEN 0 AND 9;
```

## Seguranca de dados

| Campo | Tratamento |
|-------|-----------|
| CPF | AES-256-GCM (armazenamento) + HMAC-SHA256 (dedup) |
| Senha | SHA-256 no estilo do cliente do jogo |
| E-mail | Normalizado lowercase, validado por regex |
| AccountName | Normalizado UPPERCASE, 4-16 alfanumerico |

## Arquivos

- `api/src/routes/index.ts` — POST `/api/auth/register`
- `api/src/utils/crypto.ts` — Funcoes de criptografia
- `api/src/db.ts` — Conexoes com UPTPortal e UserDB
- `api/migrations/V2__Security_OTP_CSRF_ClassDef.sql` — Tabelas OTP e indexes
