"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { createClient } from "../utils/supabase/client";

const ROUTE_META: Record<string, { secao: string; titulo: string }> = {
  "/": { secao: "Operação", titulo: "Visão Geral" },
  "/pedidos": { secao: "Operação", titulo: "Pedidos" },
  "/catalogo": { secao: "Operação", titulo: "Catálogo" },
  "/clientes": { secao: "Operação", titulo: "Clientes" },
  "/relatorios": { secao: "Operação", titulo: "Relatórios" },
  "/configuracoes": { secao: "Configuração", titulo: "Configurações" },
};

export function TopbarV2() {
  const pathname = usePathname();
  const router = useRouter();
  const [lojaAberta, setLojaAberta] = useState(true);
  const [carregandoLogout, setCarregandoLogout] = useState(false);

  const meta = ROUTE_META[pathname] || { secao: "Dashboard", titulo: "Página" };

  async function handleLogout() {
    setCarregandoLogout(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    } finally {
      setCarregandoLogout(false);
    }
  }

  return (
    <header className="topbar-v2">
      {/* Esquerda: breadcrumb + título */}
      <div className="topbar-left">
        <span className="topbar-breadcrumb">
          {meta.secao} / <span className="topbar-breadcrumb-active">{meta.titulo}</span>
        </span>
        <h1 className="topbar-title">{meta.titulo}</h1>
      </div>

      {/* Direita: ações */}
      <div className="topbar-right">
        {/* Dúvidas */}
        <button className="topbar-btn" type="button">
          Dúvidas
        </button>

        {/* Toggle Loja Aberta */}
        <button
          className="topbar-toggle"
          type="button"
          onClick={() => setLojaAberta((v) => !v)}
          aria-pressed={lojaAberta}
        >
          <span className="topbar-toggle-label">Loja Aberta</span>
          <div className={`topbar-toggle-pill ${lojaAberta ? "on" : "off"}`}>
            <div className="topbar-toggle-dot" />
          </div>
        </button>

        {/* Minha Conta */}
        <button
          className="topbar-btn"
          type="button"
          onClick={handleLogout}
          disabled={carregandoLogout}
        >
          {carregandoLogout ? "Saindo..." : "Minha Conta"}
        </button>

        {/* Badge IA Ativa */}
        <div className="topbar-badge-ia">
          <div className="topbar-badge-dot" />
          <span className="topbar-badge-ia-text">IA Ativa</span>
        </div>
      </div>
    </header>
  );
}
