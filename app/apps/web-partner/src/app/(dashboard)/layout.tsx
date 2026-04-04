import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError, fetchAPI } from "../../lib/api";
import { SidebarNav } from "../../components/SidebarNav";
import { OrderNotification } from "../../components/OrderNotification";

type StoreSettings = { id: string; name: string };

async function verificarAcesso() {
  try {
    await fetchAPI("/partner/dashboard/summary");
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return "sem-acesso";
    return true;
  }
}

async function fetchStoreId(): Promise<string | null> {
  try {
    const settings = await fetchAPI<StoreSettings>("/partner/store/settings");
    return settings.id;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acesso = await verificarAcesso();
  if (acesso === "sem-acesso") redirect("/sem-acesso");

  const storeId = await fetchStoreId();

  return (
    <div className="wp-shell">
      <div className="wp-layout">
        <aside className="wp-sidebar">
          <div className="wp-sidebar-header">
            <div className="wp-sidebar-logo">
              <div className="wp-sidebar-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="wp-sidebar-logo-name">Vendza</span>
            </div>
            <div className="wp-sidebar-store">Painel parceiro</div>
          </div>

          <SidebarNav />

          <div className="wp-sidebar-footer">
            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.45)",
                transition: "color 180ms",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </Link>
          </div>
        </aside>

        <main className="wp-main">
          <div className="wp-page">
            {children}
          </div>
        </main>
      </div>
      {storeId && <OrderNotification storeId={storeId} />}
    </div>
  );
}
