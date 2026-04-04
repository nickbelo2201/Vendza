import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../../lib/api";

type Cliente = {
  id: string; name: string; phone: string; email: string | null;
  totalSpentCents: number; isInactive: boolean; lastOrderAt: string | null;
};

async function getClientes(): Promise<Cliente[]> {
  try { return await fetchAPI<Cliente[]>("/partner/customers"); }
  catch (err) { if (err instanceof ApiError) return []; return []; }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default async function CustomersPage() {
  const clientes = await getClientes();

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Clientes</h1>
            <p>Base de clientes com histórico e sinais de recorrência.</p>
          </div>
          <span className="wp-badge wp-badge-blue">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {clientes.length === 0 ? (
          <div className="wp-empty">
            <span className="wp-empty-icon">👥</span>
            <p className="wp-empty-title">Nenhum cliente ainda</p>
            <p className="wp-empty-desc">Clientes são criados automaticamente no primeiro pedido.</p>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Total gasto</th>
                <th>Último pedido</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="wp-row" style={{ gap: 10 }}>
                      <div className="wp-avatar">{getInitials(c.name)}</div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.phone}</div>
                    {c.email && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email}</div>}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>
                      {formatCurrency(c.totalSpentCents)}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td>
                    {c.isInactive
                      ? <span className="wp-badge wp-badge-amber">Inativo</span>
                      : <span className="wp-badge wp-badge-green">Ativo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
