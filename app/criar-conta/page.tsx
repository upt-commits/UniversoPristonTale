import type { Metadata } from "next";
import { IntegrationNotice, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Criar conta · UPT",
  description: "Cadastro oficial do Universo Priston Tale.",
};

export default function RegisterPage() {
  return (
    <PortalPage
      eyebrow="COMECE SUA JORNADA"
      title="Sua lenda começa com uma conta segura."
      description="O cadastro definitivo gravará no mecanismo oficial do jogo somente por uma API restrita e validada."
    >
      <div className="auth-layout">
        <section className="auth-card" aria-labelledby="register-title">
          <div className="card-heading">
            <span>CADASTRO OFICIAL</span>
            <h2 id="register-title">Criar conta UPT</h2>
            <p>Campos preparados para a integração do Login Server.</p>
          </div>
          <form className="auth-form auth-form-grid">
            <div><label htmlFor="new-account">Nome da conta</label><input id="new-account" disabled /></div>
            <div><label htmlFor="new-email">E-mail</label><input id="new-email" type="email" disabled /></div>
            <div><label htmlFor="new-password">Senha</label><input id="new-password" type="password" disabled /></div>
            <div><label htmlFor="confirm-password">Confirmar senha</label><input id="confirm-password" type="password" disabled /></div>
            <label className="check-row"><input type="checkbox" disabled /> Li e aceito os termos e a política de privacidade.</label>
            <button type="button" disabled>Criar minha conta</button>
          </form>
        </section>
        <IntegrationNotice title="Cadastro em homologação">
          A interface está pronta, mas a criação permanecerá bloqueada até confirmarmos regras reais de conta, formato de senha, unicidade, recuperação, consentimento LGPD, proteção contra robôs e transação no banco oficial.
        </IntegrationNotice>
      </div>
    </PortalPage>
  );
}
