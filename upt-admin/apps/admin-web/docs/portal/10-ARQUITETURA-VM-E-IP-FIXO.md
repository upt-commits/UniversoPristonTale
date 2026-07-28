# Arquitetura VM + IP fixo `148.224.63.68`

**Estado**: PROPOSTO. Nada foi executado. Aguardando autorização e respostas
das perguntas abertas ao final deste documento.

## Situação atual (auditada em 2026-07-22)

Tudo roda na sua máquina local com `127.0.0.1`:

| Componente         | Onde                                                    | IP hoje     | Porta      |
|--------------------|---------------------------------------------------------|-------------|------------|
| Login Server       | `Files/Server/login-server/Server.exe`                  | 127.0.0.1   | 10009      |
| Game Server        | `Files/Server/game-server/Server.exe`                   | 127.0.0.1   | 30010      |
| IIS + ClanSystem   | Default Web Site apontando pra `Files/ClanSystem`       | 127.0.0.1   | 80         |
| SQL Server         | `MSSQLSERVER` (instância default)                       | 127.0.0.1   | 1433       |
| Portal Next        | `_WEB_UPT/portal` em desenvolvimento                    | 127.0.0.1   | 3000/3737  |
| API Express        | `_WEB_UPT/api` (esqueleto vazio)                        | —           | 3001       |
| `hotuk.ini`        | `Files/Game/hotuk.ini` com `*CLAN_SERVER=127.0.0.1`     | —           | —          |

`Files/Server/login-server/server.ini` e `.../game-server/server.ini` foram
alterados por você em algum momento para apontar `Database` a
`(localdb)\MSSQLLocalDB` sem usuário/senha. **Se subir os servers assim,
eles não conseguem conectar** — a instância real é `(local)` (MSSQLSERVER) e
o `sa/123` continua sendo a credencial em uso. Vamos consertar isso na F1.

## Topologia alvo (VM em `148.224.63.68`)

```
INTERNET
   │
   │  (público, com firewall estrito)
   │
   ├── TCP 443  → NGINX/IIS (HTTPS) → Portal Next.js (proxy interno)
   ├── TCP 80   → NGINX/IIS (HTTP → 301 HTTPS) 
   ├── TCP 10009 → Login Server (protocolo próprio, criptografado)
   ├── TCP 30010 → Game Server (protocolo próprio, criptografado)
   ├── TCP 80/Clan/*.asp → IIS Classic ASP (apenas endpoints /Clan e /ClanImage)
   │
   │   BLOQUEADOS PUBLICAMENTE:
   ├── TCP 1433  ← SQL Server (só localhost/rede interna)
   ├── TCP 3389  ← RDP (só via VPN ou IP allowlist)
   ├── TCP 3000  ← Dev server Next (só localhost)
   └── TCP 3001  ← API Express (só localhost, proxied por NGINX/IIS)

VM 148.224.63.68 (Windows Server ou Windows equivalente)
├── SQL Server (bind 127.0.0.1:1433 apenas; NUNCA público)
├── IIS + Classic ASP → ClanSystem (só endpoints /Clan e /ClanImage)
├── Login Server + Game Server (bind 0.0.0.0:10009/30010)
├── API Node/Express (bind 127.0.0.1:3001)
├── Portal Next (bind 127.0.0.1:3000, servido via reverse proxy)
└── (opcional) NGINX ou IIS ARR como reverse proxy para o portal
```

## Sistema "local ↔ produção" (o que você pediu)

Ideia: você desenvolve em `D:\Priston Tale UPT de volta` (localhost), e quando
está pronto, publica na VM com um script. Fluxo proposto:

1. **Configs por ambiente** — nada de IP hard-coded. Cada componente tem um
   arquivo `*.local.*` (127.0.0.1) e um `*.prod.*` (148.224.63.68). O script
   de deploy escolhe o certo.
2. **Script `scripts/deploy-to-vm.ps1`** que faz, na ordem:
   - Build do server.dll (Release Login/Win32) → OK, já sabemos fazer.
   - Build do portal (`next build`) → gera `.next/`.
   - Empacota: `server.dll`, `Server.exe`, `Data/`, `.next/`, ClanSystem/,
     hotuk.ini gerado, .env de produção **sem segredos** — segredos vão à
     parte via `.env.production.local` que fica só na VM.
   - Envia via `scp`/`robocopy over SSH`/`Deploy-WebFile` para a VM.
   - Reinicia serviços na VM (IIS pool, Server.exe via NSSM, etc.).
   - Roda health-check.
3. **Nunca commitar** `.env.production.local`, `settings.asp` com senha real,
   backups de banco com dados de conta, nem chaves.
4. **Segredos em cofre local** (arquivo cifrado com senha, ou variável de
   ambiente do runner) — não no repositório.

## Contratos de segurança (não-negociáveis)

1. **SQL Server nunca exposto publicamente.** Bind em `127.0.0.1:1433` +
   Windows Firewall bloqueando TCP 1433 na interface pública.
2. **Fim do `sa/123`.** Criar 3 logins SQL de menor privilégio:
   - `game_svc` — read/write nas tabelas de gameplay usadas pelo `server.dll`.
   - `clan_svc` — read/write só nas tabelas de clã usadas pelo ASP.
   - `portal_api_svc` — read/write só nas tabelas de conta/personagem/shop.
   Cada connection string usa o login mínimo.
3. **API Express nunca exposta direto.** Proxy pelo NGINX/IIS, com:
   - Rate limit por IP e por conta.
   - JWT curto (~15 min) + refresh token seguro (httpOnly, sameSite=lax).
   - CORS restrito ao domínio oficial.
   - Validação de todos os inputs (Zod ou equivalente).
   - Queries **parametrizadas** — nunca concatenação de string.
4. **Portal público nunca escreve direto no SQL nem chama servidores do
   jogo.** Só fala com a API.
5. **Shop / entrega de item** só via `ItemBox`. Webhook de pagamento assinado
   pelo provedor (HMAC), idempotente por evento e por pedido. Estado explícito
   `created → paid → delivery_pending → delivered` com rollback previsto.
6. **Painel do char (equipar, editar, resetar stats)** — cada ação sensível
   passa por:
   - Confirmação de senha ou MFA.
   - Auditoria (quem/quando/o que).
   - Rate limit.
   - Bloqueio se char está online (evita corrida com server em memória — foi
     o problema que tivemos com o gold do clan).
7. **Anti-hack básico:**
   - Fail2Ban (ou equivalente Windows) pra bloquear IP com muitas tentativas
     de login.
   - `hotuk.ini` continua usando IP; certificado TLS para o portal apenas.
   - Log de acesso rotacionado, sem PII em plaintext.
   - Backup diário do banco com rotação e teste de restauração mensal.

## Riscos que o IP público `148.224.63.68` traz

1. **DDoS** — provedor da VM precisa oferecer mitigação básica, ou você
   precisa colocar Cloudflare/Akamai na frente do site (do jogo é mais
   complexo porque não é HTTP).
2. **Scan de porta constante** — inevitável. Firewall estrito e portas
   fechadas resolvem 99%.
3. **SQL injection no ClanSystem legado** — o `settings.asp` tem
   `BlackList = Array("--", ";")` como única defesa. É frágil. **Antes
   de expor 80 publicamente**, precisamos migrar o ClanSystem pra queries
   parametrizadas ou colocar WAF/regras que barrem SQL injection.
4. **Contas usando senha fraca no algoritmo do PT clássico** — o Login
   Server tem seu próprio esquema (não vi ainda o hash exato). Se for
   MD5/SHA1 raw, é ruim, e trocar quebra clientes antigos. Requer plano
   de migração progressiva.

## O que preciso saber de você antes de tocar em qualquer coisa

<!-- Preencha as respostas aqui ou me diga por chat. Sem essas informações,
     qualquer deploy é chute e pode expor dados. -->

1. **Você já tem acesso à VM `148.224.63.68`?**
   - Se sim: SSH ou RDP? Windows Server ou Linux?
   - Se for Linux, quem vai rodar `Server.exe` (Wine)? Recomendo Windows.
2. **Quem controla o firewall/security group da VM?** Você tem UI do provedor
   (Contabo, Vultr, AWS, Azure, DigitalOcean) pra abrir portas específicas?
3. **Domínio `universopt.com.br` — DNS onde?** (Registro.br, Cloudflare, etc.)
   Você tem acesso ao painel pra criar `A` record apontando pra
   `148.224.63.68` e configurar TLS?
4. **HTTPS/TLS** — quer Let's Encrypt (win-acme na VM) ou vai colocar
   Cloudflare na frente (grátis, oferece cache + WAF + DDoS)?
5. **Provedor de pagamento** — Mercado Pago (sandbox + prod)? PagSeguro?
   Já tem conta de vendedor?
6. **SQL Server na VM** — instalar SQL Server Express na VM e migrar dados
   por `.bak`, ou usar SQL gerenciado do provedor?
7. **Deploy** — quer que eu escreva o script pra rodar do seu Windows local
   (PowerShell + `scp` via OpenSSH), ou monta CI depois?

## Ordem sugerida (nenhum passo sem sua aprovação explícita)

- **F1**: parametrizar configs por ambiente (local vs prod) sem mexer em VM.
  Corrigir os `server.ini` que estão apontando para `(localdb)` (vai quebrar).
  Gerar `hotuk.ini.template` pra facilitar geração por deploy.
- **F2**: hardening do backend na sua máquina (novos logins SQL, ASP com
  queries parametrizadas, WAF simples). Ainda sem VM.
- **F3**: prepara pacote de deploy — só arquivos versionados, sem segredos.
- **F4**: configurar VM (instalar Windows Server / IIS / SQL / Firewall).
- **F5**: primeiro deploy (blank) e teste de conectividade.
- **F6**: portal público apontando pra `www.universopt.com.br` com TLS.
- **F7**: API + integrações (status, cadastro, painel char, shop).
- **F8**: shop + pagamento + webhook + ItemBox.
- **F9**: monitoring, backup, runbook.

Cada fase é uma sessão separada. Nada é irreversível.
