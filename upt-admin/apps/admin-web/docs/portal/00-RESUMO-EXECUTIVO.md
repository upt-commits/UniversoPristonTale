# FASE 0 — Resumo Executivo (Portal UPT)

**Data**: 2026-07-22
**Escopo**: apenas descoberta e inventário. Nenhuma edição de código, nenhuma
publicação, nenhum push, nenhuma alteração de DNS ou banco.

## Divergência crítica de escopo — declaração inicial

O prompt refere-se a construir/continuar um **portal público** em
`https://github.com/upt-commits/UniversoPristonTale.git` cujo domínio pretendido
é `https://www.universopt.com.br`.

**Nada disso existe neste ambiente**:

| Item pedido no prompt                                            | Estado real                     |
|------------------------------------------------------------------|---------------------------------|
| Repositório `github.com/upt-commits/UniversoPristonTale.git`     | **Sem remote no `_WEB_UPT/admin`** (`git remote -v` vazio) |
| Commit local `b76e9fa`                                           | **Não existe** — só `2047414 Initial commit from Create Next App` |
| Preview `universo-priston-tale.beto1910.chatgpt.site`            | Não verificável daqui           |
| Domínio `www.universopt.com.br` (CNAME / TXT)                    | Não posso consultar DNS externo daqui |
| `hosting.json` / `.openai/hosting.json`                          | Não encontrado                  |
| Página inicial pública com home cinematográfica, blocos de shop/rankings/notícias | **Não existe. O que existe é o `admin panel` (painel administrativo interno).** |

**O que existe neste ambiente** (auditado abaixo) é um projeto `admin/` — um
painel de administração — e um esqueleto de API. Ambos em fase inicial. O
portal público voltado ao jogador **ainda não foi construído**.

## Recomendação para esta rodada

Antes de avançar a Fase 1 (build/publicação), preciso da sua decisão sobre
uma dessas rotas:

1. **Consolidar o que existe como "admin panel"** e planejar o portal público
   como projeto separado (recomendado — o admin não deveria virar o portal
   por confusão de escopo e de segurança).
2. **Criar do zero um novo projeto `_WEB_UPT/portal/`** para a home pública,
   mantendo o `admin/` como interface interna.
3. **Aguardar até que o repositório oficial `upt-commits/UniversoPristonTale`
   seja clonado localmente** e trabalhar a partir dele.

Nenhuma dessas rotas pode ser executada sem aprovação, porque cada uma tem
consequência diferente (topologia, deploy, DNS, segurança).

## Escopo desta Fase 0

Somente inspeção. Detalhes nos demais docs:

- `01-INVENTARIO-REPOSITORIO.md`
- `02-MAPA-ARQUITETURA-ATUAL.md`
- `03-MATRIZ-FUNCIONALIDADES.md`
- `04-AUDITORIA-HOME-E-CONTEUDO.md`
- `05-DOMINIO-HOSPEDAGEM-E-SSL.md`

## Sinais de alerta encontrados

1. **Dado fake na home do admin** — o dashboard mostra `Servidor Online` em
   pill verde permanente (linha 24 de `page.tsx`), independente do estado
   real. Viola a regra do prompt "Não inventar quantidade de jogadores,
   status online, datas de eventos…". Deve ser trocado por `Em preparação`
   ou por leitura da API real (que ainda não retorna nada útil).
2. **API vazia** — `_WEB_UPT/api/src/server.ts` e `routes/index.ts` existem
   mas nenhuma rota concreta implementada.
3. **`fetch("http://localhost:3001/api/*")` hard-coded** em várias páginas
   do admin — quebra em produção. Precisa de `NEXT_PUBLIC_API_URL` de
   ambiente.
4. **Next.js 16.2.11** — o próprio `AGENTS.md` do repo avisa: "This is NOT
   the Next.js you know. This version has breaking changes." Antes de
   editar precisamos consultar `node_modules/next/dist/docs/`.
5. **Sem `.env.example`** — variáveis obrigatórias não documentadas.
6. **Sem remote git no admin** — não conectado ao GitHub oficial.
7. **`api/` sem git** — não versionado.
8. **`node_modules` versionado em `admin/.git`?** — confirmar via
   `.gitignore` (existe um `.gitignore` de 480 bytes — parece OK, mas há
   `.next` presente que deveria estar no ignore).
9. **Auditoria anterior** (`_AUDITORIA_UPT/SITE_PORTAL_100_ONLINE/`) já
   documentou: "Não ha base segura para implementar cadastro, login web,
   UPT Shop, tickets, CMS, downloads, rankings públicos, RBAC
   administrativo, Mercado Pago ou ponte com `UPTServerManager.exe` sem o
   prompt principal e sem contrato real de schemas/endpoints." Continua
   válido.

## O que NÃO fiz (respeitando o prompt)

- Não editei código.
- Não rodei `npm install` novamente (poderia mudar `package-lock.json`).
- Não rodei `next build` ainda (fase 1).
- Não fiz push / PR.
- Não alterei DNS / hospedagem.
- Não conectei ao SQL de produção.
- Não instalei nada global.

## Limites do meu ambiente (transparência)

- **Sem acesso ao GitHub `upt-commits`** — não posso clonar/consultar o
  repositório oficial.
- **Sem acesso a DNS público** — não posso verificar propagação de
  `universopt.com.br` daqui.
- **Sem provedor de pagamento (Mercado Pago sandbox)** — não posso testar
  webhook e conciliação.
- **Sem 2 clientes de jogo simultâneos** — testes ponta a ponta com dois
  jogadores dependem de você.

## Próximo passo recomendado

Antes de qualquer Fase 1:

1. Você me diz qual das 3 rotas prefere (consolidar admin / criar portal
   novo / aguardar repo oficial).
2. Se autorizado, executo o restante da Fase 0 (build/lint/typecheck no
   admin) sem alterar código.
3. Só depois disso passamos pra Fase 1 (consolidar e publicar).
