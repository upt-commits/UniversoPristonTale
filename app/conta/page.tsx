import type { Metadata } from "next";
import { IntegrationNotice, ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Painel do jogador · UPT",
  description: "Painel de conta, personagens, moedas, compras e segurança do Universo Priston Tale.",
};

export default function AccountPage() {
  return (
    <PortalPage
      eyebrow="PAINEL DO JOGADOR"
      title="Tudo da sua jornada em um só lugar."
      description="Conta, personagens, UPT Coins, compras, segurança e suporte serão exibidos somente depois de autenticação real."
    >
      <IntegrationNotice title="Área protegida ainda indisponível">
        O painel não apresenta personagens, saldo ou histórico fictício. Quando o gateway for ativado, cada módulo exigirá sessão válida e autorização da própria conta.
      </IntegrationNotice>
      <div className="module-grid">
        <ModuleCard tag="CONTA" title="Perfil e segurança">E-mail mascarado, troca de senha, sessões ativas, verificação e histórico de segurança.</ModuleCard>
        <ModuleCard tag="PERSONAGENS" title="Seus heróis">Personagens, classe, nível, clã e informações públicas permitidas pelo servidor.</ModuleCard>
        <ModuleCard tag="MOEDAS" title="UPT Coins">Saldo confirmado, pedidos, créditos e conciliação de pagamentos sem duplicidade.</ModuleCard>
        <ModuleCard tag="COMPRAS" title="Pedidos e entregas">Status do pagamento até a entrega única pelo Distribuidor de Itens.</ModuleCard>
        <ModuleCard tag="SUPORTE" title="Meus chamados" href="/suporte" action="Abrir central">Tickets, anexos e acompanhamento das solicitações.</ModuleCard>
        <ModuleCard tag="CLÃ" title="Meu clã" href="/clas" action="Ver sistema de clãs">Dados oficiais do ClanDB, quando a integração legada estiver homologada.</ModuleCard>
      </div>
    </PortalPage>
  );
}
