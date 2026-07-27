import type { Metadata } from "next";
import { IntegrationNotice, PortalPage } from "../portal-shell";

export const metadata: Metadata = {
  title: "Entrar na conta · UPT",
  description: "Acesso seguro à conta do Universo Priston Tale.",
};

export default function LoginPage() {
  return (
    <PortalPage
      eyebrow="ÁREA DO JOGADOR"
      title="Entre no seu Universo."
      description="O acesso será conectado ao Login Server por um gateway autenticado, sem expor o banco de dados do jogo à internet."
    >
      <div className="auth-layout">
        <section className="auth-card" aria-labelledby="login-title">
          <div className="card-heading">
            <span>ACESSO SEGURO</span>
            <h2 id="login-title">Minha conta</h2>
            <p>Use somente o portal oficial para entrar.</p>
          </div>
          <form className="auth-form">
            <label htmlFor="account">Conta</label>
            <input id="account" name="account" autoComplete="username" disabled />
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" disabled />
            <button type="button" disabled>Entrar</button>
          </form>
          <div className="auth-links">
            <a href="/criar-conta">Criar uma conta</a>
            <a href="/suporte">Preciso de ajuda</a>
          </div>
        </section>
        <div className="auth-aside">
          <IntegrationNotice title="Login ainda não ativado">
            Nenhuma credencial digitada nesta versão será enviada ou armazenada. A abertura ocorrerá somente após o gateway da VM, sessão segura, limitação de tentativas e auditoria passarem nos testes.
          </IntegrationNotice>
          <ModuleCardList />
        </div>
      </div>
    </PortalPage>
  );
}

function ModuleCardList() {
  return (
    <div className="security-list">
      <div><b>01</b><span>Banco SQL nunca acessado pelo navegador</span></div>
      <div><b>02</b><span>Sessão protegida e expiração controlada</span></div>
      <div><b>03</b><span>Logs sem senha, token ou dados desnecessários</span></div>
    </div>
  );
}
