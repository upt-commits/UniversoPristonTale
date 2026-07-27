# Auditoria da importação `_WEB_UPT`

Data: 25/07/2026  
Arquivo analisado: `_WEB_UPT_20260725_133117.zip`

## Resultado executivo

O ZIP contém três projetos independentes:

- `portal/`: Next.js 16, React 19 e TypeScript;
- `admin/`: Next.js 16, React 19 e TypeScript;
- `api/`: Express 5 e TypeScript.

Os três projetos instalam e compilam. Compilar, entretanto, não significa que
estejam seguros ou conectados ao servidor real.

## Conteúdo aproveitado

- logotipo oficial `upt-logo.png`;
- organização conceitual do portal;
- linguagem visual medieval;
- rotas planejadas para conta, download, eventos, shop e notícias;
- documentação de separação entre portal, API e administração;
- regra de não mostrar dados fictícios no portal público.

O logotipo do ZIP é idêntico ao ativo já usado pelo Site. A home do ZIP é uma
implementação diferente e mais simples da home cinematográfica publicada; por
isso, a versão visual publicada foi preservada.

## Portal

O projeto `portal/` passou em:

- ESLint;
- TypeScript;
- build de produção do Next.js.

Ele não possuía autenticação, painel do jogador, integração com banco, pagamentos
ou download real. Os componentes de cabeçalho e status serviram como referência,
mas a home publicada foi mantida por oferecer melhor apresentação.

## API — não aprovada para produção

O projeto `api/` compila, mas não pode ser publicado no estado recebido:

- `cors()` é aberto;
- não existe autenticação;
- não existe autorização por função;
- não existe validação dos corpos recebidos;
- não existe limitação de tentativas;
- não existe proteção contra repetição ou idempotência;
- dashboard, contas e faturamento são dados simulados;
- banimento é aplicado sobre uma lista em memória;
- comandos de broadcast e spawn são formados por concatenação de texto;
- há conexão TCP direta ao processo do jogo;
- não há prova de protocolo autenticado, assinatura, nonce ou allowlist;
- erros são registrados sem política estruturada;
- não há testes;
- não há integração SQL real.

Essa API foi mantida apenas na cópia de auditoria. Nenhum trecho foi incorporado
ao Site público.

## Admin — não aprovado para produção

O projeto `admin/` também compila, mas é um protótipo visual:

- exibe servidor online sem teste real;
- exibe jogadores, GM, CPU, RAM, receita e drops simulados;
- consulta `http://localhost:3001` diretamente pelo navegador;
- permite ações de ban, broadcast e spawn sem sessão ou RBAC;
- contém uma chave demonstrativa escrita no código da página;
- possui formulário para host, usuário e senha do SQL no navegador;
- não possui MFA, auditoria, dupla aprovação ou CSRF;
- não separa ações de leitura, operação e segurança.

O admin não foi incorporado à aplicação pública. Uma versão futura deverá ser
um serviço separado, de acesso restrito, com RBAC, MFA, trilha de auditoria e
ações críticas confirmadas no servidor.

## Arquivos e dados sensíveis

O arquivo recebido não continha executáveis, certificados privados, backups do
SQL ou `.env` com valores reais. A chave encontrada no admin é identificada como
valor demonstrativo e deve ser tratada como inválida.

## Decisão de unificação

1. Preservar a home cinematográfica publicada.
2. Reaproveitar logo, linguagem e arquitetura conceitual.
3. Criar as rotas públicas no mesmo Site.
4. Manter login e cadastro bloqueados até existir gateway real.
5. Não mostrar personagens, ranking, saldo, preços ou status fictícios.
6. Não publicar o admin ou a API recebidos.
7. Implementar o gateway na VM como projeto separado.
8. Somente depois ligar o Site ao gateway por HTTPS e contratos mínimos.

## Pendências externas

- identificar esquema real de contas e algoritmo real de senha;
- auditar LoginDB, UserDB, GameDB e ClanDB;
- confirmar procedures e permissões mínimas;
- implementar gateway interno na VM;
- configurar TLS e segredo servidor-a-servidor;
- definir provedor de pagamento e credenciais fora do código;
- homologar webhook, fila, worker e conciliação;
- auditar Distribuidor de Itens e `AddItemOpenBox`;
- definir manifesto assinado do launcher;
- publicar URLs e hashes reais;
- implantar admin separado com RBAC e MFA;
- executar testes externos de cadastro, login, personagem, pagamento, entrega,
  atualização e rollback.
