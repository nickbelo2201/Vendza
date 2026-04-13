"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "../../../utils/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        setErro(error.message);
        return;
      }
      setSucesso(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="wp-auth-card" style={{ textAlign: "center" }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="wp-auth-title">Senha redefinida!</h2>
        <p className="wp-auth-subtitle">
          Sua senha foi alterada com sucesso.
          <br />
          Redirecionando para o dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="wp-auth-card">
      <h1 className="wp-auth-title">Defina uma nova senha</h1>
      <p className="wp-auth-subtitle">
        Escolha uma senha segura para proteger sua conta.
      </p>

      <form onSubmit={handleSubmit} className="wp-stack">
        <div className="wp-field">
          <label htmlFor="nova-senha" className="wp-label">Nova senha</label>
          <input
            id="nova-senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            className="wp-input"
            disabled={carregando}
          />
        </div>

        <div className="wp-field">
          <label htmlFor="confirmar" className="wp-label">Confirmar senha</label>
          <input
            id="confirmar"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repita a senha"
            required
            className="wp-input"
            disabled={carregando}
          />
        </div>

        {erro && <div className="wp-error-box">{erro}</div>}

        <button type="submit" className="wp-button" disabled={carregando} style={{ width: "100%", marginTop: 4 }}>
          {carregando ? "Atualizando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}
