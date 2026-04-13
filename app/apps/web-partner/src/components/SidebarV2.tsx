"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Ícones SVG ── */
function IconGrid() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconCube() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function IconPerson() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
}

function IconAI() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <circle cx="4"  cy="6"  r="2"/>
      <circle cx="20" cy="6"  r="2"/>
      <circle cx="4"  cy="18" r="2"/>
      <circle cx="20" cy="18" r="2"/>
      <line x1="6"  y1="7"  x2="10" y2="11"/>
      <line x1="14" y1="11" x2="18" y2="7"/>
      <line x1="6"  y1="17" x2="10" y2="13"/>
      <line x1="14" y1="13" x2="18" y2="17"/>
    </svg>
  );
}

function IconTrend() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function IconEstoque() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
      <path d="M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
      <line x1="12" y1="3" x2="12" y2="9"/>
    </svg>
  );
}

function IconFinanceiro() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="sidebar-v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

/* ── Logo oficial ── */
function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-white.png" alt="Vendza" style={{ height: 36, width: "auto", objectFit: "contain" }} />
  );
}

/* ── Itens de navegação ── */
const operacao = [
  { href: "/",          label: "Visão Geral",       icon: <IconGrid /> },
  { href: "/pedidos",   label: "Pedidos",            icon: <IconBox /> },
  { href: "/catalogo",  label: "Produtos",           icon: <IconCube /> },
  { href: "/estoque",   label: "Estoque",            icon: <IconEstoque /> },
  { href: "/clientes",  label: "Clientes",           icon: <IconPerson /> },
  { href: "/relatorios",label: "Relatórios",         icon: <IconBarChart /> },
  { href: "/financeiro", label: "Financeiro",         icon: <IconFinanceiro /> },
];

const inteligencia = [
  { href: "#", label: "IA Insights",        icon: <IconAI /> },
  { href: "#", label: "Previsão de Vendas", icon: <IconTrend /> },
  { href: "#", label: "Automação",          icon: <IconRefresh /> },
];

export function SidebarV2() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "#") return false;
    return pathname.startsWith(href);
  }

  return (
    <div className="sidebar-v2">
      {/* Logo */}
      <div className="sidebar-v2-logo">
        <Logo />
      </div>

      {/* Grupo Operação */}
      <div className="sidebar-v2-group">
        <span className="sidebar-v2-group-label">Operação</span>
        {operacao.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-v2-link${isActive(item.href) ? " active" : ""}`}
          >
            {item.icon}
            <span className="sidebar-v2-link-label">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Divisor */}
      <hr className="sidebar-v2-divider" />

      {/* Grupo Inteligência */}
      <div className="sidebar-v2-group">
        <span className="sidebar-v2-group-label">Inteligência</span>
        {inteligencia.map((item) => (
          <div
            key={item.label}
            className="sidebar-v2-link"
            style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }}
          >
            {item.icon}
            <span className="sidebar-v2-link-label">{item.label}</span>
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: "var(--v2-text-muted, #6B7280)",
              color: "#fff",
              borderRadius: 4,
              padding: "1px 5px",
              marginLeft: "auto",
            }}>
              Em breve
            </span>
          </div>
        ))}
      </div>

      {/* Divisor */}
      <hr className="sidebar-v2-divider" />

      {/* Configurações */}
      <div className="sidebar-v2-group">
        <Link
          href="/configuracoes"
          className={`sidebar-v2-link${isActive("/configuracoes") ? " active" : ""}`}
        >
          <IconSettings />
          <span className="sidebar-v2-link-label">Configurações</span>
        </Link>
      </div>
    </div>
  );
}
