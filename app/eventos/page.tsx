import type { Metadata } from "next";
import { IntegrationNotice, ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Eventos · UPT",
  description: "Calendário e eventos oficiais do Universo Priston Tale.",
};

export default function EventsPage() {
  return (
    <PortalPage
      eyebrow="CALENDÁRIO DO MUNDO"
      title="Eventos ligados ao servidor real."
      description="O portal exibirá somente eventos publicados pelo CMS e estados confirmados pelos sistemas oficiais do jogo."
    >
      <div className="module-grid module-grid-three">
        <ModuleCard tag="BLESS CASTLE" title="Guerra de clãs">Resultado, proprietário e agenda virão do CBlessCastleHandler, sem tabela paralela.</ModuleCard>
        <ModuleCard tag="AUTOMÁTICOS" title="Eventos do mundo">Agenda, duração e situação confirmadas pela integração do servidor.</ModuleCard>
        <ModuleCard tag="COMUNIDADE" title="Campanhas especiais">Anúncios revisados, regras claras e histórico de alterações.</ModuleCard>
      </div>
      <IntegrationNotice title="Calendário em preparação">
        Nenhum horário ou recompensa é exibido até existir uma fonte autoritativa e testada.
      </IntegrationNotice>
    </PortalPage>
  );
}
