"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { createClient } from "../utils/supabase/client";
import { useNewOrders } from "../hooks/useNewOrders";

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
  const [carregandoLogout, setCarregandoLogout] = useState(false);
  const { count: novoPedidos, reset: resetNovoPedidos } = useNewOrders();

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
        {/* Link de Pedidos com badge de novos pedidos */}
        <Link
          href="/pedidos"
          onClick={resetNovoPedidos}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            position: "relative", textDecoration: "none",
          }}
          className="topbar-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          Pedidos
          {novoPedidos > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 18, height: 18, borderRadius: 9,
              background: "#ef4444", color: "#fff",
              fontSize: 10, fontWeight: 700,
              padding: "0 5px",
              lineHeight: 1,
            }}>
              {novoPedidos > 99 ? "99+" : novoPedidos}
            </span>
          )}
        </Link>

        {/* Dúvidas */}
        <button className="topbar-btn" type="button">
          Dúvidas
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
