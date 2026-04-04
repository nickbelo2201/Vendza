import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../lib/api";

type DashboardSummary = {
  ordersToday: number;
  revenueCents: number;
  averageTicketCents: number;
  recurringCustomers: number;
  newCustomers: number;
};

async function getDashboard(): Promise<DashboardSummary | null> {
  try {
    return await fetchAPI<DashboardSummary>("/partner/dashboard/summary");
  } catch (err) {
    if (err instanceof ApiError) return null;
    return null;
  }
}

export default async function PartnerHomePage() {
  const s = await getDashboard();

  const kpis = [
    {
      label: "Pedidos hoje",
      value: s ? String(s.ordersToday) : "—",
      accent: "green",
      icon: "📦",
    },
    {
      label: "Faturamento",
      value: s ? formatCurrency(s.revenueCents) : "—",
      accent: "blue",
      icon: "💰",
    },
    {
      label: "Ticket médio",
      value: s ? formatCurrency(s.averageTicketCents) : "—",
      accent: "amber",
      icon: "📊",
    },
    {
      label: "Clientes recorrentes",
      value: s ? String(s.recurringCustomers) : "—",
      accent: "green",
      icon: "👥",
    },
  ];

  return (
    <div className="wp-stack-lg">
      {/* Header */}
      <div className="wp-page-header">
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color: "var(--night)" }}>
          Bom dia, parceiro 👋
        </h1>
        <p style={{ color: "var(--s3)", fontSize: 15, marginTop: 6 }}>Aqui está o resumo da sua operação hoje.</p>
      </div>

      {!s && (
        <div className="wp-note">
          API indisponível. Certifique-se de que o servidor está rodando em{" "}
          <code style={{ fontFamily: "monospace", fontSize: 12 }}>localhost:3333</code>.
        </div>
      )}

      {/* KPIs */}
      <div className="wp-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="wp-card wp-kpi wp-span-3">
            <div className={`wp-kpi-accent wp-kpi-accent-${kpi.accent}`} />
            <div className="wp-stat">
              <span className="wp-stat-label">{kpi.label}</span>
              <span className="wp-stat-value">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="wp-grid">
        <div className="wp-panel wp-span-12">
          <div className="wp-row-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--night)", letterSpacing: "-0.02em" }}>Acesso rápido</h2>
          </div>
          <div className="wp-grid">
            {[
              { href: "/pedidos",       label: "Gerenciar pedidos",   desc: "Confirme, prepare e despache", icon: "📦", color: "#2D6A4F" },
              { href: "/catalogo",      label: "Atualizar catálogo",  desc: "Produtos e disponibilidade",   icon: "🏷️", color: "#1B3A4B" },
              { href: "/clientes",      label: "Ver clientes",        desc: "CRM e recorrência",             icon: "👥", color: "#E07B39" },
              { href: "/configuracoes", label: "Configurações",       desc: "Loja, horários e entrega",      icon: "⚙️", color: "#4338CA" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="wp-card wp-span-3 wp-quick-card"
                style={{ display: "flex", flexDirection: "column", gap: 8, textDecoration: "none" }}
              >
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--carbon)" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
