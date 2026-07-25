const events = [
  {
    kind: "Sistema oficial",
    title: "Bless Castle",
    description:
      "Agenda, proprietário e resultados serão exibidos a partir do handler oficial do servidor.",
    badge: "EM INTEGRAÇÃO",
    mark: "BC",
  },
  {
    kind: "Programação oficial",
    title: "Calendário de eventos",
    description:
      "Horários, regras e recompensas aparecerão somente depois da publicação no CMS.",
    badge: "EM PREPARAÇÃO",
    mark: "CAL",
  },
  {
    kind: "Automação do mundo",
    title: "Eventos do servidor",
    description:
      "Situação confirmada pelo servidor, sem eventos ou números simulados no portal.",
    badge: "EM HOMOLOGAÇÃO",
    mark: "EV",
  },
];

const shopCategories = [
  {
    eyebrow: "Personalização",
    title: "Visuais exclusivos",
    copy: "Trajes e aparências para destacar seu personagem sem perder a essência clássica.",
    mark: "V",
    tone: "violet",
  },
  {
    eyebrow: "Aventura",
    title: "Montarias",
    copy: "Companheiras de jornada para atravessar o continente com presença e personalidade.",
    mark: "M",
    tone: "amber",
  },
  {
    eyebrow: "Conveniência",
    title: "Utilidades",
    copy: "Recursos práticos organizados em uma loja transparente e integrada à sua conta.",
    mark: "U",
    tone: "emerald",
  },
  {
    eyebrow: "Novos jogadores",
    title: "Pacotes iniciais",
    copy: "Seleções pensadas para começar bem, entender o mundo e evoluir no próprio ritmo.",
    mark: "+",
    tone: "crimson",
  },
];

const news = [
  {
    category: "Portal",
    date: "22 JUL 2026",
    title: "Uma nova porta para o Universo Priston Tale",
    copy: "Conheça a nova experiência do portal UPT, construída para levar você do cadastro ao jogo sem complicação.",
  },
  {
    category: "Desenvolvimento",
    date: "EM BREVE",
    title: "Diário de desenvolvimento do servidor",
    copy: "Acompanhe os testes, melhorias e decisões que estão preparando um mundo estável para a comunidade.",
  },
  {
    category: "Guia",
    date: "EM BREVE",
    title: "Prepare-se para iniciar sua jornada",
    copy: "Requisitos, instalação, criação de conta e os primeiros passos reunidos em um guia direto.",
  },
];

export default function Home() {
  return (
    <main id="inicio">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />

        <div className="announcement">
          <span className="announcement-dot" aria-hidden="true" />
          O novo Universo está sendo preparado
          <a href="#noticias">Acompanhe as novidades</a>
        </div>

        <header className="site-header shell">
          <a className="brand" href="#inicio" aria-label="Universo Priston Tale — início">
            <img
              src="/upt-logo.png"
              alt="UPT — Universo Priston Tale"
              width="220"
              height="126"
            />
          </a>

          <nav className="desktop-nav" aria-label="Navegação principal">
            <a href="/eventos">Eventos</a>
            <a href="/shop">Shop</a>
            <a href="/noticias">Notícias</a>
            <a href="/rankings">Rankings</a>
            <a href="/download">Download</a>
          </nav>

          <a className="account-link" href="/entrar">
            Minha conta
          </a>

          <details className="mobile-menu">
            <summary aria-label="Abrir menu">Menu</summary>
            <nav aria-label="Navegação móvel">
              <a href="/eventos">Eventos</a>
              <a href="/shop">Shop</a>
              <a href="/noticias">Notícias</a>
              <a href="/rankings">Rankings</a>
              <a href="/clas">Clãs</a>
              <a href="/download">Download</a>
              <a href="/entrar">Minha conta</a>
            </nav>
          </details>
        </header>

        <div className="hero-content shell">
          <div className="hero-copy">
            <p className="eyebrow"><span /> MMORPG CLÁSSICO · COMUNIDADE BRASILEIRA</p>
            <h1 id="hero-title">
              Entre no Universo.
              <span>Escreva sua lenda.</span>
            </h1>
            <p className="hero-description">
              Reviva a essência de Priston Tale em uma jornada construída com
              cuidado, grandes batalhas, eventos marcantes e uma comunidade para
              chamar de sua.
            </p>
            <div className="hero-actions" id="cadastro">
              <a className="button button-primary" href="/criar-conta">
                <span>Criar conta</span>
                <b aria-hidden="true">→</b>
              </a>
              <a className="button button-secondary" href="/download">
                Baixar cliente
              </a>
            </div>
            <p className="hero-note">Acesso gratuito · Conteúdo em português · Fair play</p>
          </div>

          <aside className="server-panel" aria-label="Status do servidor">
            <div className="panel-heading">
              <div>
                <span>Status do mundo</span>
                <strong>UPT — Temporada 1</strong>
              </div>
              <span className="status-badge"><i /> Em preparação</span>
            </div>
            <div className="server-stats">
              <div>
                <span>Servidor</span>
                <strong>Brasil</strong>
              </div>
              <div>
                <span>Idioma</span>
                <strong>PT-BR</strong>
              </div>
              <div>
                <span>Acesso</span>
                <strong>Gratuito</strong>
              </div>
            </div>
            <div className="panel-footer">
              <span>Última atualização</span>
              <strong>Portal em desenvolvimento</strong>
            </div>
          </aside>
        </div>

        <div className="hero-scroll" aria-hidden="true">
          <span />
          Explore o universo
        </div>
      </section>

      <section className="start-strip" id="comecar" aria-label="Como começar">
        <div className="shell start-grid">
          <article>
            <span className="step">01</span>
            <div><strong>Crie sua conta</strong><p>Seu acesso seguro ao Universo.</p></div>
          </article>
          <article>
            <span className="step">02</span>
            <div><strong>Baixe o launcher</strong><p>Instalação e atualização simples.</p></div>
          </article>
          <article>
            <span className="step">03</span>
            <div><strong>Comece sua lenda</strong><p>Escolha sua classe e aventure-se.</p></div>
          </article>
          <a href="/status">Ver preparação <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <div id="conteudo">
        <section className="section events-section" id="eventos">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow"><span /> AVENTURAS QUE MOVEM O MUNDO</p>
                <h2>Eventos em destaque</h2>
              </div>
              <a className="text-link" href="/eventos">Ver calendário completo <span>→</span></a>
            </div>

            <div className="event-grid">
              {events.map((event, index) => (
                <article className={index === 0 ? "event-card featured" : "event-card"} key={event.title}>
                  <div className="event-orb" aria-hidden="true">{event.mark}</div>
                  <div className="event-meta"><span>{event.kind}</span><b>{event.badge}</b></div>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <a href="/eventos" aria-label={`Saiba mais sobre ${event.title}`}>
                    Saiba mais <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shop-section" id="shop">
          <div className="shell">
            <div className="shop-intro">
              <div>
                <p className="eyebrow"><span /> UPT SHOP</p>
                <h2>Seu personagem.<br /><em>Seu estilo.</em></h2>
              </div>
              <div>
                <p>
                  Descubra categorias planejadas para personalizar sua jornada.
                  O catálogo definitivo será publicado após os testes de
                  equilíbrio e integração com o jogo.
                </p>
                <a className="button button-secondary" href="/shop">Conhecer o Shop</a>
              </div>
            </div>

            <div className="shop-grid">
              {shopCategories.map((item) => (
                <article className={`shop-card ${item.tone}`} key={item.title}>
                  <div className="shop-visual" aria-hidden="true">
                    <span>{item.mark}</span>
                  </div>
                  <div className="shop-card-body">
                    <span>{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                    <a href="/shop" aria-label={`Explorar ${item.title}`}>Explorar <b>→</b></a>
                  </div>
                </article>
              ))}
            </div>
            <p className="shop-disclaimer">Itens e categorias sujeitos à validação antes do lançamento.</p>
          </div>
        </section>

        <section className="section news-section" id="noticias">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow"><span /> DIRETO DO CONTINENTE</p>
                <h2>Últimas notícias</h2>
              </div>
              <a className="text-link" href="/noticias">Todas as notícias <span>→</span></a>
            </div>

            <div className="news-grid">
              {news.map((item, index) => (
                <article className={index === 0 ? "news-card lead" : "news-card"} key={item.title}>
                  <div className="news-image" aria-hidden="true">
                    <span>{index === 0 ? "UPT" : index === 1 ? "DEV" : "GUIA"}</span>
                  </div>
                  <div className="news-body">
                    <div><span>{item.category}</span><time>{item.date}</time></div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                    <a href="/noticias" aria-label={`Ler ${item.title}`}>Ler notícia <span>→</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="download-section" id="download">
          <div className="download-glow" aria-hidden="true" />
          <div className="shell download-content">
            <div className="download-logo" aria-hidden="true">UPT</div>
            <div>
              <p className="eyebrow"><span /> PREPARE-SE PARA JOGAR</p>
              <h2>O seu próximo capítulo<br />começa aqui.</h2>
              <p>
                O launcher oficial cuidará da instalação, das atualizações e da
                integridade do cliente. O download será liberado assim que a
                versão pública concluir os testes finais.
              </p>
            </div>
            <div className="download-actions">
              <span>WINDOWS · CLIENTE OFICIAL</span>
              <a className="button button-primary" href="/download">
                Avisar quando liberar <b>→</b>
              </a>
              <small>Nunca baixe o UPT por fontes não oficiais.</small>
            </div>
          </div>
        </section>

        <section className="community-section" id="comunidade">
          <div className="shell community-card">
            <div>
              <p className="eyebrow"><span /> COMUNIDADE UPT</p>
              <h2>Não perca o chamado.</h2>
              <p>Novidades, testes e a data de abertura serão anunciados pelos canais oficiais.</p>
            </div>
            <div className="community-links">
              <a href="https://www.universopt.com.br" aria-label="Portal oficial Universo Priston Tale">
                <span>Portal oficial</span><strong>universopt.com.br</strong>
              </a>
              <a href="/noticias">
                <span>Atualizações</span><strong>Acompanhar notícias</strong>
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <img src="/upt-logo.png" alt="UPT — Universo Priston Tale" width="160" height="92" />
            <p>Um novo universo. Uma lenda que começa com você.</p>
          </div>
          <div>
            <strong>Jogue</strong>
            <a href="/criar-conta">Criar conta</a>
            <a href="/download">Download</a>
            <a href="/eventos">Eventos</a>
          </div>
          <div>
            <strong>Descubra</strong>
            <a href="/noticias">Notícias</a>
            <a href="/shop">UPT Shop</a>
            <a href="/rankings">Rankings</a>
            <a href="/clas">Clãs</a>
          </div>
          <div>
            <strong>Suporte</strong>
            <a href="/suporte">Central de ajuda</a>
            <a href="/seguranca">Segurança</a>
            <a href="/status">Status</a>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>© 2026 Universo Priston Tale. Todos os direitos reservados.</span>
          <span>www.universopt.com.br</span>
        </div>
      </footer>
    </main>
  );
}
