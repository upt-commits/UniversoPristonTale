import type { Metadata } from "next";
import { IntegrationNotice, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Rankings · UPT",
  description: "Rankings oficiais do Universo Priston Tale.",
};

const rankingTypes = ["Nível", "Classe", "PvP", "Clãs", "Bellatra"];

export default function RankingsPage() {
  return (
    <PortalPage
      eyebrow="HERÓIS DO UNIVERSO"
      title="Rankings oficiais e verificáveis."
      description="Classificações por nível, classe, PvP, clã e Bellatra, com regras de privacidade e atualização controlada."
    >
      <div className="ranking-tabs" aria-label="Tipos de ranking">
        {rankingTypes.map((type) => <span key={type}>{type}</span>)}
      </div>
      <section className="empty-state">
        <div aria-hidden="true">R</div>
        <h2>Ranking aguardando integração</h2>
        <p>Não exibimos nomes, níveis ou posições fictícias. Os dados serão publicados por uma leitura segura e limitada dos bancos oficiais.</p>
      </section>
      <IntegrationNotice>
        A API pública retornará somente os campos necessários, com cache, paginação e proteção contra consultas abusivas.
      </IntegrationNotice>
    </PortalPage>
  );
}
