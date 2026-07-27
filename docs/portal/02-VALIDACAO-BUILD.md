# docs/portal/02-VALIDACAO-BUILD.md

Este documento descreve os procedimentos de validação de build de produção para o Portal UPT.

---

## Procedimento de Build Padrão

A validação do build local é feita compilando a aplicação por completo através do `vinext`:

```powershell
# Compilação
npx vinext build
```

## Validação de Artefatos

O build gera a pasta `dist/` contendo:
* **`dist/server/index.js`**: O Worker do Cloudflare compilado.
* **`dist/.openai/hosting.json`**: O manifesto de hospedagem do portal.

### Script de Validação de Formato (Node.js)

O formato ESM do Worker e a existência do método `default.fetch` são verificados programaticamente executando o script de validação:

```powershell
node scripts/validate-artifact-win.mjs
```

### Resultados Obtidos

* **ESLint**: Sucesso (0 erros, 2 warnings de LCP de `<img>` aceitáveis).
* **TypeScript**: Sucesso (0 erros).
* **Build output**: Sucesso.
* **Worker fetch**: Sucesso (retorno ESM validado).
