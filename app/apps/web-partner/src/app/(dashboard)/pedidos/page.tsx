import { Suspense } from "react";

import { ApiError, fetchAPI } from "../../../lib/api";
import { FiltroStatus } from "./FiltroStatus";
import { PedidosClient } from "./PedidosClient";

type OrderItem = { productId: string; title: string; quantity: number; totalCents: number };
type Order = {
  id: string; publicId: string; status: string; channel: string;
  customerName: string; customerPhone: string; paymentMethod: string;
  totalCents: number; placedAt: string; items: OrderItem[];
};

type OrdersResponse = { orders: Order[]; total: number; page: number; pageSize: number };

async function getPedidos(status?: string): Promise<Order[]> {
  try {
    const path = status ? `/partner/orders?status=${status}` : "/partner/orders";
    const resp = await fetchAPI<OrdersResponse>(path);
    return resp?.orders ?? [];
  } catch (err) {
    if (err instanceof ApiError) return [];
    return [];
  }
}

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFiltro = params.status ?? "";
  const pedidos = await getPedidos(statusFiltro || undefined);

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Pedidos</h1>
            <p>Confirme, prepare e despache em tempo real.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="wp-badge wp-badge-blue">
              {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
            </span>
            <a
              href={`/api/exportar-pedidos${statusFiltro ? `?status=${statusFiltro}` : ""}`}
              className="wp-btn wp-btn-secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </a>
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: 4 }}>
        <Suspense fallback={null}>
          <FiltroStatus statusAtivo={statusFiltro} />
        </Suspense>
      </div>

      <PedidosClient pedidos={pedidos} statusFiltro={statusFiltro} />
    </div>
  );
}
