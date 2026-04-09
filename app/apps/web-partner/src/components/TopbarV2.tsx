"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

type Props = {
  toggleLoja?: React.ReactNode;
};

export function TopbarV2({ toggleLoja }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [carregandoLogout, setCarregandoLogout] = useState(false);
  const { count: novoPedidos, reset: resetNovoPedidos } = useNewOrders();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vendza-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark((saved || (prefersDark ? 'dark' : 'light')) === 'dark');
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vendza-theme', theme);
  }

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
        {/* Toggle status da loja */}
        {toggleLoja}

        {/* Toggle Dark/Light Mode */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {/* Ícone Sol */}
          <svg
            className="theme-toggle-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: isDark ? 0.4 : 1, transition: 'opacity 300ms' }}
          >
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          {/* Track */}
          <div className={`theme-toggle-track${isDark ? " dark" : ""}`}>
            <div className={`theme-toggle-thumb${isDark ? " dark" : ""}`} />
          </div>
          {/* Ícone Lua */}
          <svg
            className="theme-toggle-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: isDark ? 1 : 0.4, transition: 'opacity 300ms' }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

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
        <Link href="/configuracoes" className="topbar-btn">
          Minha Conta
        </Link>

        {/* Sair */}
        <button
          className="topbar-btn"
          type="button"
          onClick={handleLogout}
          disabled={carregandoLogout}
          style={{ color: carregandoLogout ? "var(--text-muted)" : undefined }}
        >
          {carregandoLogout ? "Saindo..." : "Sair"}
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
