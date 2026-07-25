import type { Metadata } from "next";
import { IntegrationNotice, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Status do servidor · UPT",
  description: "Estado dos serviços oficiais do Universo Priston Tale.",
};

const services = [
  ["Portal", "Disponível", "available"],
  ["Cadastro e login", "Em integração", "pending"],
  ["Servidor de jogo", "Aguardando health-check", "pending"],
  ["UPT Shop", "Em homologação", "pending"],
  ["Launcher e download", "Em testes", "pending"],
];

export default function StatusPage() {
  return (
    <PortalPage
      eyebrow="STATUS DOS SERVIÇOS"
      title="Transparência antes de promessas."
      description="O portal separa disponibilidade da página, autenticação, jogo, loja e downloads."
    >
      <section className="status-list">
        {services.map(([name, state, tone]) => (
          <div key={name}>
            <span>{name}</span>
            <strong className={tone}><i aria-hidden="true" />{state}</strong>
          </div>
        ))}
      </section>
      <IntegrationNotice title="Status do jogo não inferido pelo site">
        O portal não declara o servidor online apenas porque esta página abriu. O estado do mundo dependerá de um teste real, limitado e separado das portas administrativas.
      </IntegrationNotice>
    </PortalPage>
  );
}
