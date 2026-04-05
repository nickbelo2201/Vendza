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

/* ── Logo hexágono ── */
function HexLogo() {
  return (
    <svg className="sidebar-v2-logo-hex" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L26 8.5V19.5L14 26L2 19.5V8.5Z" fill="#2D5A3D"/>
      <path
        d="M9 19L12 9L14 15L16 9L19 19"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Itens de navegação ── */
const operacao = [
  { href: "/",          label: "Visão Geral",       icon: <IconGrid /> },
  { href: "/pedidos",   label: "Pedidos",            icon: <IconBox /> },
  { href: "/catalogo",  label: "Produtos",           icon: <IconCube /> },
  { href: "/clientes",  label: "Clientes",           icon: <IconPerson /> },
  { href: "/relatorios",label: "Relatórios",         icon: <IconBarChart /> },
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
        <HexLogo />
        <span className="sidebar-v2-logo-text">Vendza</span>
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
          <Link
            key={item.label}
            href={item.href}
            className="sidebar-v2-link"
          >
            {item.icon}
            <span className="sidebar-v2-link-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
