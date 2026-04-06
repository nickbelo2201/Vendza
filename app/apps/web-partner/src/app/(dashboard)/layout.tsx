import { redirect } from "next/navigation";

import { ApiError, fetchAPI } from "../../lib/api";
import { SidebarV2 } from "../../components/SidebarV2";
import { TopbarWrapper } from "../../components/TopbarWrapper";
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
    <div className="v2-shell">
      <SidebarV2 />
      <div className="v2-body">
        <TopbarWrapper />
        <main className="v2-main">
          {children}
        </main>
      </div>
      {storeId && <OrderNotification storeId={storeId} />}
    </div>
  );
}
