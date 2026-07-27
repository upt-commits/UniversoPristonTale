import type { Metadata } from "next";
import { IntegrationNotice, ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Download oficial · UPT",
  description: "Baixe o launcher oficial do Universo Priston Tale.",
};

export default function DownloadPage() {
  return (
    <PortalPage
      eyebrow="CLIENTE OFICIAL"
      title="Baixe, atualize e jogue com segurança."
      description="O download será liberado somente com versão, tamanho, assinatura e SHA-256 confirmados."
    >
      <section className="download-release-card">
        <div className="download-seal">UPT</div>
        <div>
          <span>WINDOWS · LAUNCHER OFICIAL</span>
          <h2>Universo Priston Tale</h2>
          <p>Instalação, atualização, reparo e rollback controlados pelo launcher oficial.</p>
        </div>
        <button type="button" disabled>Download em preparação</button>
      </section>
      <IntegrationNotice title="Nenhum arquivo público liberado">
        Não publicamos link provisório, versão, tamanho ou hash inventado. Quando o instalador aprovado estiver disponível, esta página mostrará todos os dados verificáveis.
      </IntegrationNotice>
      <div className="module-grid module-grid-three">
        <ModuleCard tag="INTEGRIDADE" title="SHA-256">Hash publicado para conferir se o arquivo baixado é exatamente o oficial.</ModuleCard>
        <ModuleCard tag="ATUALIZAÇÃO" title="Launcher automático">Patches atômicos, retomada, validação e recuperação em caso de falha.</ModuleCard>
        <ModuleCard tag="SUPORTE" title="Problemas para instalar?" href="/suporte" action="Consultar ajuda">Guias e atendimento para instalação, reparo e atualização.</ModuleCard>
      </div>
    </PortalPage>
  );
}
