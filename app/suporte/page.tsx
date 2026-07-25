import type { Metadata } from "next";
import { IntegrationNotice, ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Suporte · UPT",
  description: "Central de ajuda e chamados do Universo Priston Tale.",
};

export default function SupportPage() {
  return (
    <PortalPage
      eyebrow="CENTRAL DE AJUDA"
      title="Suporte claro, seguro e acompanhável."
      description="Guias públicos e chamados autenticados para conta, instalação, jogo, pagamento e denúncias."
    >
      <div className="module-grid module-grid-three">
        <ModuleCard tag="CONTA" title="Acesso e segurança">Recuperação, alteração de dados e proteção da conta.</ModuleCard>
        <ModuleCard tag="CLIENTE" title="Instalação e launcher" href="/download" action="Ver download">Download, atualização, reparo e códigos de erro.</ModuleCard>
        <ModuleCard tag="PAGAMENTO" title="UPT Coins e pedidos" href="/shop" action="Ver UPT Shop">Conciliação, prazo de crédito e atendimento por pedido.</ModuleCard>
        <ModuleCard tag="JOGO" title="Problemas no mundo">Personagem, itens, mapa, evento e comportamento inesperado.</ModuleCard>
        <ModuleCard tag="DENÚNCIA" title="Fair play">Canal protegido para denúncias, com anexos e rastreabilidade.</ModuleCard>
        <ModuleCard tag="CHAMADOS" title="Meus tickets" href="/conta" action="Entrar na conta">Histórico, situação, respostas e anexos da sua solicitação.</ModuleCard>
      </div>
      <IntegrationNotice title="Abertura de chamados em preparação">
        O formulário será ativado com autenticação, antispam, anexos seguros, política de retenção e SLA publicado.
      </IntegrationNotice>
    </PortalPage>
  );
}
