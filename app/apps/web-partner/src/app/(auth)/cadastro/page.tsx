"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "../../../utils/supabase/client";

export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    setCarregando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        setErro(error.message.includes("already registered") ? "Este email já está cadastrado." : error.message);
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 className="wp-auth-title">Verifique seu email</h2>
        <p className="wp-auth-subtitle">
          Enviamos um link de confirmação para <strong>{email}</strong>.
          Após confirmar, você pode fazer login.
        </p>
        <Link href="/login" className="wp-button" style={{ display: "inline-flex", marginTop: 8 }}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="wp-auth-card">
      <h1 className="wp-auth-title">Criar conta</h1>
      <p className="wp-auth-subtitle">O acesso ao painel é liberado após vinculação da loja.</p>

      <form onSubmit={handleSubmit} className="wp-stack">
        <div className="wp-field">
          <label htmlFor="email" className="wp-label">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="wp-input" />
        </div>
        <div className="wp-field">
          <label htmlFor="senha" className="wp-label">Senha</label>
          <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required className="wp-input" />
        </div>
        <div className="wp-field">
          <label htmlFor="confirmar" className="wp-label">Confirmar senha</label>
          <input id="confirmar" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Repita a senha" required className="wp-input" />
        </div>

        {erro && <div className="wp-error-box">{erro}</div>}

        <button type="submit" className="wp-button" disabled={carregando} style={{ width: "100%", marginTop: 4 }}>
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="wp-auth-footer">
        Já tem conta? <Link href="/login">Fazer login</Link>
      </p>
    </div>
  );
}
