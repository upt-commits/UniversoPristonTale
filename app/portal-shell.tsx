import type { ReactNode } from "react";
import Link from "next/link";

const navigation = [
  { href: "/noticias", label: "Notícias" },
  { href: "/eventos", label: "Eventos" },
  { href: "/rankings", label: "Rankings" },
  { href: "/clas", label: "Clãs" },
  { href: "/shop", label: "UPT Shop" },
  { href: "/download", label: "Download" },
];

export function PortalHeader() {
  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" aria-hidden="true" />
        Portal oficial em desenvolvimento
        <a href="/status">Consultar andamento</a>
      </div>
      <header className="site-header shell interior-header">
        <Link className="brand" href="/" aria-label="Universo Priston Tale — início">
          {/* Vinext/Sites serves this static logo reliably without an image proxy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upt-logo.png" alt="UPT — Universo Priston Tale" width="220" height="126" />
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="account-link" href="/entrar">
          Minha conta
        </a>
        <details className="mobile-menu">
          <summary aria-label="Abrir menu">Menu</summary>
          <nav aria-label="Navegação móvel">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="/entrar">Minha conta</a>
          </nav>
        </details>
      </header>
    </>
  );
}

export function PortalFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upt-logo.png" alt="UPT — Universo Priston Tale" width="160" height="92" />
          <p>Portal oficial do Universo Priston Tale. Um novo universo, construído com segurança e transparência.</p>
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
          <a href="/rankings">Rankings</a>
          <a href="/clas">Clãs</a>
          <a href="/shop">UPT Shop</a>
        </div>
        <div>
          <strong>Suporte</strong>
          <a href="/suporte">Central de ajuda</a>
          <a href="/status">Status</a>
          <a href="/seguranca">Segurança</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Universo Priston Tale. Todos os direitos reservados.</span>
        <span>www.universopt.com.br</span>
      </div>
    </footer>
  );
}

export function PortalPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="interior-page">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <PortalHeader />
      <section className="interior-hero">
        <div className="interior-hero-art" aria-hidden="true" />
        <div className="shell interior-hero-content">
          <p className="eyebrow">
            <span /> {eyebrow}
          </p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
      <div id="conteudo" className="shell interior-content">
        {children}
      </div>
      <PortalFooter />
    </main>
  );
}

export function IntegrationNotice({
  title = "Integração em preparação",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="integration-notice" role="status">
      <span aria-hidden="true">i</span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}

export function ModuleCard({
  tag,
  title,
  children,
  href,
  action = "Saiba mais",
}: {
  tag: string;
  title: string;
  children: ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <article className="module-card">
      <span>{tag}</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {href ? <a href={href}>{action} <b aria-hidden="true">→</b></a> : <small>Em preparação</small>}
    </article>
  );
}
