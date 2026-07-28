# Testes de Integração e E2E — Contas UPT

Este documento descreve os testes de validação realizados no fluxo de autenticação e segurança.

## 1. Testes Automatizados Executados

### Validação Criptográfica (API)
* Validação de CPFs com dígitos corretos e incorretos.
* Verificação de cálculo de idade para menoridade de 12 anos.
* Compatibilidade do hash de senha gerado em SHA-256 com o algoritmo lido pelo Login Server (`Game.exe`).

### Validação HTML (Portal)
* Carregamento correto de todos os campos habilitados do formulário `/entrar`.
* Teste de verificação SSR de todas as rotas públicas (`/criar-conta`, `/entrar`, `/conta`).

## 2. Massa de Testes Sugerida

* Conta: `TESTACCOUNT1`
* CPF: `111.444.777-35`
* Idade: Maior de 18 anos
