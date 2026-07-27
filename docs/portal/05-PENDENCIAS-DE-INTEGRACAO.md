# docs/portal/05-PENDENCIAS-DE-INTEGRACAO.md

Este documento registra as integrações de backend pendentes para ativação futura do Portal UPT.

---

## Pendências Externas (Gateway & Login Server)

Para que o portal atinja a funcionalidade total (fora do escopo estático), é obrigatório desenvolver e homologar:

1. **Gateway REST Seguro**:
   * API bindada em porta HTTPS na VM (`148.224.63.68`).
   * Tratamento de requisições de criação de conta com validação contra SQL Injections.
   * Controle de rate limit e prevenção de abusos de força bruta (antispam).

2. **Integração com Login Server**:
   * API de autenticação por tokens (HMAC-SHA256) em vez de troca direta de strings de senha.
   * Interface com procedures seguras no SQL para recuperar status de personagens e clãs.

3. **Integração com Provedor de Pagamento (UPT Coins)**:
   * Registro de Webhook de confirmação de pagamento seguro.
   * Lógica de conciliação atômica para impedir duplicação de saldo.
   * Faturamento e entrega dos créditos no Distribuidor de Itens (`AddItemOpenBox`).
