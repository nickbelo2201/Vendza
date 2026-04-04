import Link from "next/link";

import { createClient } from "../../../utils/supabase/server";

export default async function SemAcessoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function sair() {
    "use server";
    const sb = await createClient();
    await sb.auth.signOut();
  }

  return (
    <div className="wp-panel" style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
      <span className="wp-badge" style={{ marginBottom: 16, background: "rgba(145,80,20,0.1)", color: "var(--alert)" }}>
        Acesso pendente
      </span>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Sua conta ainda não tem loja vinculada</h1>
      <p style={{ color: "var(--muted)", marginBottom: 8, fontSize: 14, lineHeight: 1.6 }}>
        Você está autenticado como <strong>{user?.email}</strong>, mas sua conta ainda não está
        vinculada a nenhuma loja na Vendza.
      </p>
      <p style={{ color: "var(--muted)", marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
        Entre em contato com o administrador para liberar seu acesso.
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <form action={sair}>
          <button type="submit" className="wp-button wp-button-secondary" style={{ cursor: "pointer" }}>
            Sair da conta
          </button>
        </form>
        <Link href="mailto:suporte@vendza.com.br" className="wp-button">
          Contatar suporte
        </Link>
      </div>
    </div>
  );
}
