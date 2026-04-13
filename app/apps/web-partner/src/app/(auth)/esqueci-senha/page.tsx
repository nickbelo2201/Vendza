"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "../../../utils/supabase/client";

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!email.trim()) {
      setErro("Por favor, insira seu email.");
      return;
    }
    setCarregando(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
      });
      if (error) {
        setErro(error.message);
        return;
      }
      setSucesso(true);
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
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h2 className="wp-auth-title">Verifique seu email</h2>
        <p className="wp-auth-subtitle">
          Enviamos um link de redefinição de senha para <strong>{email}</strong>.
          <br />
          Clique no link para escolher uma nova senha.
        </p>
        <Link href="/login" className="wp-button" style={{ display: "inline-flex", marginTop: 8 }}>
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="wp-auth-card">
      <h1 className="wp-auth-title">Recuperar senha</h1>
      <p className="wp-auth-subtitle">
        Informe o email associado à sua conta para receber um link de redefinição.
      </p>

      <form onSubmit={handleSubmit} className="wp-stack">
        <div className="wp-field">
          <label htmlFor="email" className="wp-label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="wp-input"
            disabled={carregando}
          />
        </div>

        {erro && <div className="wp-error-box">{erro}</div>}

        <button type="submit" className="wp-button" disabled={carregando} style={{ width: "100%", marginTop: 4 }}>
          {carregando ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>

      <p className="wp-auth-footer">
        Lembrou a senha? <Link href="/login">Fazer login</Link>
      </p>
    </div>
  );
}
