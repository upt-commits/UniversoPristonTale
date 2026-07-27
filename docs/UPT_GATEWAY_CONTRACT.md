# Contrato de segurança do Gateway UPT

## Objetivo

Conectar `www.universopt.com.br` aos serviços do Universo Priston Tale sem
expor SQL Server, ODBC, Login Server, Game Server ou portas administrativas ao
navegador.

## Topologia

```text
Navegador
  -> Portal público HTTPS
  -> Backend-for-frontend do portal
  -> Gateway UPT HTTPS na VM
  -> procedures/adaptadores autorizados
  -> bancos e serviços oficiais do jogo
```

O cliente do jogo continua usando o endpoint próprio do jogo. Portal e admin não
usam essa porta.

## Limites obrigatórios

- SQL Server não recebe conexão da internet pública.
- O Site não contém usuário ou senha do SQL.
- O navegador não recebe segredo do gateway.
- O gateway aceita somente HTTPS.
- Comunicação servidor-a-servidor usa autenticação própria, rotação e allowlist.
- Cada operação possui timeout, limite de corpo e identificador de correlação.
- Entrada é validada por schema estrito.
- Saída contém somente os campos necessários.
- Logs não contêm senha, token, chave, connection string ou dados pessoais
  desnecessários.

## Sessão do jogador

- autenticação conferida no mecanismo real do Login Server;
- cookie `HttpOnly`, `Secure` e `SameSite`;
- identificador opaco, com expiração e revogação;
- rotação após login e ações sensíveis;
- proteção CSRF para mutações;
- limitação de tentativas por conta, IP e dispositivo;
- resposta uniforme para conta inexistente e senha incorreta;
- recuperação de conta separada do login;
- MFA opcional para jogador e obrigatório para staff.

Antes de implementar, confirmar o algoritmo real de senha. Não migrar, regravar
ou transformar hashes por suposição.

## Endpoints públicos planejados

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/public/status` | estado limitado dos serviços |
| `GET` | `/v1/public/news` | notícias publicadas |
| `GET` | `/v1/public/events` | eventos publicados |
| `GET` | `/v1/public/rankings` | rankings paginados e minimizados |
| `GET` | `/v1/public/clans` | dados públicos de clãs |
| `POST` | `/v1/auth/register` | criação de conta oficial |
| `POST` | `/v1/auth/session` | login |
| `DELETE` | `/v1/auth/session` | logout/revogação |
| `GET` | `/v1/account/me` | perfil mínimo da conta autenticada |
| `GET` | `/v1/account/characters` | personagens autorizados da conta |
| `GET` | `/v1/account/wallet` | saldo e extrato de UPT Coins |
| `GET` | `/v1/account/orders` | pedidos da própria conta |
| `POST` | `/v1/shop/orders` | criação idempotente de pedido |

Nenhuma rota aceita nome de conta arbitrário para retornar dados privados. A
conta vem da sessão validada no servidor.

## Pagamentos e UPT Coins

Fluxo:

```text
Pedido
  -> checkout do provedor
  -> webhook assinado
  -> consulta ao provedor
  -> evento idempotente
  -> fila
  -> worker
  -> crédito transacional
  -> conciliação
```

Requisitos:

- redirect do navegador nunca confirma pagamento;
- chave idempotente por pedido e evento do provedor;
- unicidade no banco para impedir crédito duplicado;
- valores e pacotes calculados no servidor;
- estado imutável do evento bruto;
- fila com retry e dead-letter;
- crédito e auditoria na mesma transação lógica;
- estorno e disputa com fluxo explícito;
- reconciliação diária.

Na primeira fase, o portal vende UPT Coins. O jogador usa a Coin Shop do jogo. A
entrega web direta de itens somente entra após homologação do Distribuidor e da
operação `AddItemOpenBox`.

## Clãs e Bless Castle

- clãs usam o ClanDB e o mecanismo legado real;
- o portal não cria tabela paralela de liderança ou membros;
- operações administrativas exigem a mesma autoridade do jogo;
- o proprietário do Bless Castle vem do `CBlessCastleHandler`;
- cache público não pode decidir vencedor ou liderança.

## Administração

O admin é um serviço separado do portal público:

- acesso restrito;
- RBAC por função e permissão;
- MFA obrigatório;
- sessão curta;
- auditoria append-only;
- motivo obrigatório;
- dupla aprovação para moedas, itens, banimentos e ações críticas;
- comandos ao jogo por allowlist de operações tipadas;
- sem console SQL e sem entrada de connection string pela interface;
- sem concatenação de comandos de texto.

## Códigos de resposta

Respostas públicas retornam código seguro e mensagem curta:

```json
{
  "error": {
    "code": "UPT-AUTH-001",
    "message": "Não foi possível concluir o acesso.",
    "correlationId": "..."
  }
}
```

Detalhes técnicos permanecem nos logs internos, ligados ao `correlationId`.

## Critério para ativar login e cadastro no Site

- contrato real de contas auditado;
- gateway publicado com TLS válido;
- segredo servidor-a-servidor configurado fora do código;
- schemas e limites implementados;
- rate limiting testado;
- sessão, CSRF e logout testados;
- logs revisados para ausência de segredos;
- testes de abuso e repetição aprovados;
- cadastro e login externos realizados em máquina limpa;
- rollback documentado.
