import type { Metadata } from "next";
import { IntegrationNotice, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Notícias · UPT",
  description: "Notícias oficiais do Universo Priston Tale.",
};

export default function NewsPage() {
  return (
    <PortalPage
      eyebrow="CENTRAL DE NOTÍCIAS"
      title="Informação oficial, sem rumores."
      description="Atualizações, eventos, manutenções e notas de versão serão publicados pelo CMS do portal."
    >
      <article className="feature-article">
        <div className="article-art"><span>UPT</span></div>
        <div>
          <span>PORTAL · 25 JUL 2026</span>
          <h2>As bases do portal UPT estão sendo unificadas</h2>
          <p>O site público, os módulos do jogador e a arquitetura administrativa estão sendo reunidos em uma única fonte controlada, preservando a identidade medieval e removendo protótipos inseguros.</p>
          <small>Desenvolvimento em andamento</small>
        </div>
      </article>
      <IntegrationNotice title="CMS ainda não conectado">
        Novas publicações não serão simuladas. A lista crescerá quando o painel editorial, a revisão e a publicação auditada estiverem ativos.
      </IntegrationNotice>
    </PortalPage>
  );
}
