"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Produtos", href: "/catalogo/produtos" },
  { label: "Categorias", href: "/catalogo/categorias" },
  { label: "Subcategorias", href: "/catalogo/subcategorias" },
  { label: "Combos", href: "/catalogo/combos" },
  { label: "Grupos de Complementos", href: "/catalogo/grupos-de-complementos" },
  { label: "Complementos", href: "/catalogo/complementos" },
  { label: "Extras", href: "/catalogo/extras" },
  { label: "Importar NF-e", href: "/catalogo/nfe" },
];

const NOMES_SECAO: Record<string, string> = {
  "/catalogo/produtos": "Produtos",
  "/catalogo/categorias": "Categorias",
  "/catalogo/subcategorias": "Subcategorias",
  "/catalogo/combos": "Combos",
  "/catalogo/grupos-de-complementos": "Grupos de Complementos",
  "/catalogo/complementos": "Complementos",
  "/catalogo/extras": "Extras",
  "/catalogo/nfe": "Importar NF-e",
};

export function CatalogoNavLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nomeSecao = NOMES_SECAO[pathname] ?? "Catálogo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <span>Operação</span>
        <span>›</span>
        <Link href="/catalogo" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Catálogo</Link>
        <span>›</span>
        <span style={{ fontWeight: 600, color: "var(--carbon)" }}>{nomeSecao}</span>
      </div>

      {/* Barra de tabs */}
      <div className="wp-panel" style={{ padding: 0 }}>
        <div style={{ display: "flex", gap: 2, overflowX: "auto", padding: "6px 8px" }}>
          {TABS.map((tab) => {
            const ativo = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: ativo ? 600 : 400,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  color: ativo ? "var(--green)" : "var(--text-muted)",
                  background: ativo ? "rgba(45,106,79,0.06)" : "transparent",
                  borderBottom: ativo ? "2px solid var(--green)" : "2px solid transparent",
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da seção */}
      {children}
    </div>
  );
}
