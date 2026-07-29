# Status real do servidor

## Decisão arquitetural

O portal público é hospedado no Cloudflare Sites e o jogo/API ficam na VM Windows. O navegador consulta apenas `GET /api/public/server-status` na mesma origem. Essa rota assina uma chamada curta ao monitor da VM com HMAC-SHA256, timestamp e nonce. O monitor rejeita replay e nunca devolve IP, porta, processo, banco ou caminho.

## Prontidão e estados

`online` exige simultaneamente, para Login Server e Game Server, o processo no caminho exato configurado, socket TCP aceitando conexão e arquivo de heartbeat recente, além de `SELECT 1` nos bancos do jogo e do portal. Socket ou processo isolado nunca produz `online`.

Prioridade: `maintenance`, operação `restarting`, operação `starting`, telemetria ausente/vencida (`unknown`), `online`, `degraded`, `partial`, `offline`. Operações têm prazo obrigatório e deixam o estado transitório quando expiram. Dois ciclos saudáveis consecutivos são exigidos para entrar em `online`; falha confirmada sai imediatamente.

Padrões: coleta 7,5 s, timeout por dependência 1,5 s, heartbeat máximo 30 s e validade total 45 s. Todos são configuráveis por ambiente. A coleta não sobrepõe execuções e o endpoint serve apenas cache.

## Controle administrativo

Manutenção é alterada somente em `/api/admin/maintenance`, após sessão administrativa, MFA e RBAC, com auditoria. O estado de controle é escrito por arquivo temporário e renomeado atomicamente. `recordOperation` deve ser chamado apenas depois que a ferramenta administrativa real aceitar um start/restart; não existe rota pública de controle.

## Deploy e rollback

Publique portal e API do mesmo commit. Configure `STATUS_MONITOR_URL` e o mesmo `STATUS_HMAC_SECRET` nos dois lados, além dos caminhos reais da VM. Rollback: reimplante a versão anterior do Sites e o artefato anterior da API; o arquivo de controle persistido não deve ser apagado. Sem configuração/heartbeat comprovado, o card mostra `Indisponível` por projeto.
