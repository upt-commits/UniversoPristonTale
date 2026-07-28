# Integração Cadastro, Login e Painel do Jogador UPT

Este documento detalha a arquitetura final de integração segura da área de contas do portal do Universo Priston Tale (UPT).

## 1. Arquitetura Geral

O fluxo de dados e comunicação opera da seguinte forma:

```
Navegador
-> HTTPS universopt.com.br
-> Portal público (Next.js/Vinext)
-> Rota relativa /api no mesmo domínio
-> IIS Reverse Proxy (IIS ARR)
-> API Local 127.0.0.1:3001
-> SQL Server local ((local))
```

## 2. Endpoints da API

* `POST /api/auth/register`: Registro unificado com transação dupla e criptografia de CPF.
* `POST /api/auth/login`: Autenticação e geração de sessão opaca.
* `GET /api/player/me`: Consulta protegida do perfil cadastrado e lista de personagens reais obtidos de `UserDB.dbo.CharacterInfo`.
* `GET /api/address/cep/:cep`: Busca de CEP em ViaCEP com tolerância a falhas.

## 3. Segurança e Criptografia

* **CPF**: Criptografado usando AES-256-GCM com IV randômico. Busca otimizada usando `CPF_HMAC` (SHA-256).
* **Parâmetros SQL**: Prevenção total contra SQL Injection via consultas parametrizadas com `mssql`.
