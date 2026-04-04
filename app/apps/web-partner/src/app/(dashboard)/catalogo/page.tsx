import { formatCurrency } from "@vendza/utils";

import { ApiError, fetchAPI } from "../../../lib/api";
import { DisponibilidadeToggle } from "./DisponibilidadeToggle";

type Produto = {
  id: string; name: string; slug: string;
  listPriceCents: number; salePriceCents: number | null;
  isAvailable: boolean; isFeatured: boolean; categorySlug: string;
};

async function getProdutos(): Promise<Produto[]> {
  try { return await fetchAPI<Produto[]>("/partner/products"); }
  catch (err) { if (err instanceof ApiError) return []; return []; }
}

export default async function CatalogPage() {
  const produtos = await getProdutos();

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Catálogo</h1>
            <p>Gerencie produtos e disponibilidade para pedidos.</p>
          </div>
          <span className="wp-badge wp-badge-blue">
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {produtos.length === 0 ? (
          <div className="wp-empty">
            <span className="wp-empty-icon">🏷️</span>
            <p className="wp-empty-title">Nenhum produto cadastrado</p>
            <p className="wp-empty-desc">Adicione produtos para começar a receber pedidos.</p>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço lista</th>
                <th>Preço venda</th>
                <th>Destaque</th>
                <th>Disponível</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.slug}</div>
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-muted">{p.categorySlug ?? "—"}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {formatCurrency(p.listPriceCents)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {p.salePriceCents ? formatCurrency(p.salePriceCents) : "—"}
                    </span>
                  </td>
                  <td>
                    {p.isFeatured
                      ? <span className="wp-badge wp-badge-amber">Destaque</span>
                      : <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    <DisponibilidadeToggle productId={p.id} isAvailable={p.isAvailable} />
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
