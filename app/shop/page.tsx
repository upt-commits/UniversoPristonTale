import type { Metadata } from "next";
import { IntegrationNotice, ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "UPT Shop · UPT",
  description: "UPT Coins, pedidos e entregas oficiais do Universo Priston Tale.",
};

export default function ShopPage() {
  return (
    <PortalPage
      eyebrow="UPT SHOP"
      title="Créditos e itens com entrega rastreável."
      description="A primeira operação segura será comprar UPT Coins e utilizar a Coin Shop do próprio jogo."
    >
      <section className="shop-flow" aria-label="Fluxo de compra">
        <div><b>01</b><span>Pedido criado</span></div>
        <div><b>02</b><span>Pagamento confirmado</span></div>
        <div><b>03</b><span>Crédito conciliado</span></div>
        <div><b>04</b><span>Compra no jogo</span></div>
        <div><b>05</b><span>Distribuidor de Itens</span></div>
      </section>
      <div className="module-grid module-grid-three">
        <ModuleCard tag="MOEDA" title="Comprar UPT Coins">Pacotes e preços serão publicados somente após contrato e homologação do pagamento.</ModuleCard>
        <ModuleCard tag="PEDIDOS" title="Acompanhar compra" href="/conta" action="Ir para minha conta">Pagamento, crédito e entrega com identificadores únicos e conciliação.</ModuleCard>
        <ModuleCard tag="SUPORTE" title="Problema com pedido?" href="/suporte" action="Abrir central">Atendimento vinculado ao pedido, sem pedir senha do jogo.</ModuleCard>
      </div>
      <IntegrationNotice title="Compras temporariamente fechadas">
        Nenhum pagamento é aceito nesta versão. O redirecionamento do navegador nunca será usado como confirmação; somente webhook validado e consulta ao provedor poderão liberar créditos.
      </IntegrationNotice>
    </PortalPage>
  );
}
