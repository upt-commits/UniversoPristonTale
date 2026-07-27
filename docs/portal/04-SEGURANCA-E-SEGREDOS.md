# docs/portal/04-SEGURANCA-E-SEGREDOS.md

Este documento consolida os princípios de segurança física, lógica e de segredos do Portal UPT.

---

## 1. Varredura de Segredos (Secret Scanning)

Antes de cada commit, é executada uma checagem de padrões para identificar chaves provisórias ou segredos reais nos arquivos alterados:
* Nenhuma senha, token ou chave privada foi encontrada no código-fonte.
* Arquivos sensíveis como `.env` e chaves privadas `.pem` estão explicitamente no `.gitignore` para impedir envios acidentais.

## 2. Isolamento de Banco de Dados

* **Acesso Zero**: O portal web p público não possui nenhuma conexão DSN, ODBC ou direct connection com o SQL Server local.
* **Privilégio Mínimo**: A comunicação futura entre o portal e o banco será mediada por um Gateway RESTful seguro na VM e executando com contas de menor privilégio (`upt_gameserver`, `upt_clansystem`), nunca via `sa`.

## 3. Prevenção de Autenticações/Pagamentos Falsos

* **Bloqueio total**: Todos os formulários que exigem escrita (Login, Cadastro, Compra) permanecem estritamente bloqueados e desabilitados até a ativação do gateway oficial.
* **Segurança de Fluxo de Caixa**: Chaves Pix ou dados de checkout não são simulados ou expostos no frontend.
