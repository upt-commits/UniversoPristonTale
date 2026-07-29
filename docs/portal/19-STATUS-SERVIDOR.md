# 19 — Status do Servidor

## Visao geral

O portal exibe o status em tempo real do servidor de jogo na pagina inicial, com informacoes sobre jogadores online, status dos servicos (Login Server e Game Server), e modo de manutencao.

## Arquitetura

```
Homepage (React) --poll 20s--> GET /api/public/server-status
                                       |
                     +---------+-------+---------+
                     |         |                 |
               TCP check   TCP check      SQL query
              port 10009   port 30010    CharacterInfo
             (Login Srv)  (Game Srv)    (IsOnline=1)
                     |         |                 |
                     +----+----+--------+--------+
                          |             |
                     ServiceStatus  PlayersOnline
```

## Endpoint

`GET /api/public/server-status`

Resposta:
```json
{
  "status": "online",
  "maintenance": false,
  "players": { "online": 42, "capacity": 500 },
  "services": {
    "loginServer": { "status": "online", "latencyMs": 2 },
    "gameServer": { "status": "online", "latencyMs": 3 }
  },
  "updatedAt": "2026-07-28T12:00:00.000Z",
  "stale": false
}
```

## Jogadores online

A contagem usa a query:
```sql
SELECT COUNT(*) FROM CharacterInfo WHERE IsOnline = 1
```

**Regras** (conforme especificacao):
- Nao contar personagens cadastrados como jogadores online
- Nao contar registros historicos
- Nao gerar numero aleatorio
- Nao usar numero estatico

## Health checks TCP

- Conexao via `net.Socket` com timeout de 3 segundos
- Login Server: host/porta configuraveis (padrao: 127.0.0.1:10009)
- Game Server: host/porta configuraveis (padrao: 127.0.0.1:30010)
- Retorna latencia em milissegundos se online

## Cache

- TTL configuravel (padrao: 10 segundos)
- Threshold de stale configuravel (padrao: 60 segundos)
- Fallback para cache stale em caso de erro
- Fallback para status "unknown" se nenhum cache disponivel

## Modo manutencao

Administradores podem ativar manutencao via tabela `ServerMaintenance`:
- `Active=1` ativa o modo manutencao
- Titulo e mensagem personalizaveis
- Data de inicio e previsao de termino

## Frontend

Componente `ServerStatusBlock` na homepage:
- Auto-refresh a cada 20 segundos
- Refresh manual com cooldown de 10 segundos
- Cores de status: verde (online), vermelho (offline), amarelo (manutencao), cinza (unknown)
- CTAs contextuais (criar conta/download quando online, retry/noticias quando offline)

## Configuracao (.env)

```
STATUS_CACHE_TTL_SECONDS=10
STATUS_STALE_THRESHOLD_SECONDS=60
STATUS_UPDATE_INTERVAL_SECONDS=15
LOGIN_SERVER_HOST=127.0.0.1
LOGIN_SERVER_PORT=10009
GAME_SERVER_HOST=127.0.0.1
GAME_SERVER_PORT=30010
SERVER_MAX_CAPACITY=0
```

## Dados nunca retornados ao navegador

- Endereco IP interno/publico da VM
- Portas internas
- Nome/caminho dos executaveis
- PID, usuario do Windows
- Connection string, credenciais
- Stack trace

## Arquivos

- `api/src/services/server-status.ts` — Checks TCP, query SQL, cache
- `api/src/routes/index.ts` — GET `/api/public/server-status`
- `app/page.tsx` — Componente ServerStatusBlock
- `api/migrations/V2__Security_OTP_CSRF_ClassDef.sql` — Tabelas ServerMaintenance, ServerStatusCache
