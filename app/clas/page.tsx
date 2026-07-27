import type { Metadata } from "next";
import { IntegrationNotice, ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Clãs · UPT",
  description: "Sistema oficial de clãs do Universo Priston Tale.",
};

export default function ClansPage() {
  return (
    <PortalPage
      eyebrow="UNIÃO E CONQUISTA"
      title="Clãs conectados ao sistema original."
      description="Páginas, membros, liderança e Bless Castle dependerão do ClanDB e do fluxo legado realmente usado pelo servidor."
    >
      <div className="module-grid module-grid-three">
        <ModuleCard tag="DIRETÓRIO" title="Encontrar clãs">Busca, emblema, liderança e informações públicas autorizadas.</ModuleCard>
        <ModuleCard tag="MEU CLÃ" title="Gestão de membros">Operações somente pelo mecanismo oficial, com autenticação e auditoria.</ModuleCard>
        <ModuleCard tag="BLESS CASTLE" title="Histórico de domínio">Vencedor e estado consultados no handler oficial do jogo.</ModuleCard>
      </div>
      <IntegrationNotice title="Auditoria do sistema legado necessária">
        A base recebida não comprova um handler moderno completo de clãs. Por segurança, o portal não criará outro sistema nem escreverá diretamente no ClanDB.
      </IntegrationNotice>
    </PortalPage>
  );
}
