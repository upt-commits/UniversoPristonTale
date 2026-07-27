# docs/portal/00-STATUS-ATUAL.md

Este documento apresenta o status atual de cada componente do Portal Universo Priston Tale (UPT).

---

## Legenda

* 🟢 **CONCLUÍDO**: Totalmente funcional e validado.
* 🟡 **PARCIAL**: Design/Interface pronto, mas sem lógica backend.
* 🔴 **BLOQUEADO**: Depende de fatores externos do servidor de jogo.
* ⚪ **NÃO IMPLEMENTADO**: Planejado para fases futuras.
* 🟦 **DEPENDÊNCIA EXTERNA**: Integrações que exigem gateway/LoginServer seguros.

---

## Status dos Componentes

| Componente | Status | Categoria | Observações |
|---|---|---|---|
| **Apresentação Visual / Home** | 🟢 CONCLUÍDO | Frontend | Layout cinematográfico responsivo ativado. |
| **Navegação e Rotas Públicas** | 🟢 CONCLUÍDO | Frontend | 13 rotas implementadas e cobertas por testes automatizados. |
| **Verificações de Segurança** | 🟢 CONCLUÍDO | Segurança | Varredura de credenciais concluída (zero segredos expostos). |
| **Build & Deploy Pipeline** | 🟢 CONCLUÍDO | CI/CD | Compilação com `vinext build` e geração de artefatos ativadas. |
| **Cadastro de Contas** | 🟦 DEP. EXTERNA | Backend | Tela pronta. Lógica bloqueada aguardando API segura do Login Server. |
| **Login do Jogador** | 🟦 DEP. EXTERNA | Backend | Tela pronta. Lógica bloqueada aguardando autenticação HTTPS com Login Server. |
| **Status do Servidor** | 🟡 PARCIAL | Frontend | Mostra estados honestos (indisponível/preparação) sem mock fictício. |
| **UPT Shop** | 🟦 DEP. EXTERNA | Backend | Catálogo visual estático pronto. Lógica de pagamento (PIX/Mercado Pago) bloqueada. |
| **Downloads do Cliente** | 🟡 PARCIAL | Frontend | Aguardando publicação oficial dos binários finais e hashes SHA-256 no CDN. |
| **Painel do Jogador** | 🟦 DEP. EXTERNA | Backend | Telas prontas. Bloqueado até que a sessão real do jogo esteja homologada. |
