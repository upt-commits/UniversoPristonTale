import type { Metadata } from "next";
import { ModuleCard, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Segurança · UPT",
  description: "Princípios de segurança do portal Universo Priston Tale.",
};

export default function SecurityPage() {
  return (
    <PortalPage
      eyebrow="SEGURANÇA UPT"
      title="O banco do jogo nunca fica exposto ao navegador."
      description="A arquitetura separa o portal público, o gateway interno, os procedimentos autorizados e os serviços do jogo."
    >
      <div className="module-grid module-grid-three">
        <ModuleCard tag="CONTAS" title="Credenciais protegidas">Senha nunca registrada em log e nunca enviada a serviços não autorizados.</ModuleCard>
        <ModuleCard tag="API" title="Gateway restrito">Validação, limitação de tentativas, idempotência, auditoria e contratos mínimos.</ModuleCard>
        <ModuleCard tag="BANCO" title="Privilégio mínimo">Nada de acesso SQL direto pelo site; somente operações específicas e autorizadas.</ModuleCard>
        <ModuleCard tag="PAGAMENTO" title="Crédito único">Webhook validado, conciliação e proteção contra duplicidade.</ModuleCard>
        <ModuleCard tag="ADMIN" title="RBAC e MFA">Painel separado do portal público, com perfis, MFA, trilha de auditoria e dupla aprovação.</ModuleCard>
        <ModuleCard tag="PRIVACIDADE" title="LGPD por desenho">Coleta mínima, finalidade clara, retenção e direitos do titular.</ModuleCard>
      </div>
    </PortalPage>
  );
}
