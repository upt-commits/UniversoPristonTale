# docs/portal/07-DEPLOY-E-ROLLBACK.md

Este documento define os procedimentos operacionais para deploy e rollback do Portal UPT.

---

## 1. Procedimento de Deploy (Hospedagem Cloudflare Workers)

O deploy do portal é automatizado pelo controle da hospedagem do Cloudflare Workers:
1. Executar build de produção:
   ```powershell
   npm run build
   ```
2. Realizar deploy usando o Wrangler CLI configurado na hospedagem:
   ```powershell
   npx wrangler deploy --name universo-priston-tale
   ```

## 2. Procedimento de Rollback de Emergência

Caso ocorra alguma falha crítica em produção, o rollback rápido para a versão estável inicial é feito reabrindo a branch do checkpoint validado:

```powershell
# Retornar ao checkpoint seguro
git switch agent/publica-portal-upt

# Re-compilar a versão anterior estável
npm run build

# Re-publicar a versão estável
npx wrangler deploy --name universo-priston-tale
```
