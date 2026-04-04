import { ApiError, fetchAPI } from "../../../lib/api";
import { FormConfiguracoes } from "./FormConfiguracoes";

type StoreSettings = {
  id: string; name: string; slug: string;
  whatsappPhone: string; status: string; minimumOrderValueCents: number;
};

async function getSettings(): Promise<StoreSettings | null> {
  try { return await fetchAPI<StoreSettings>("/partner/store/settings"); }
  catch (err) { if (err instanceof ApiError) return null; return null; }
}

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <h1>Configurações</h1>
        <p>Nome, WhatsApp, pedido mínimo e parâmetros operacionais.</p>
      </div>

      {!s ? (
        <div className="wp-note">Não foi possível carregar configurações. Verifique a conexão com a API.</div>
      ) : (
        <div className="wp-grid">
          <div className="wp-panel wp-span-8">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Dados da loja</h2>
            <FormConfiguracoes
              settings={{ name: s.name, whatsappPhone: s.whatsappPhone ?? "", minimumOrderValueCents: s.minimumOrderValueCents }}
            />
          </div>

          <div className="wp-span-4 wp-stack">
            <div className="wp-panel">
              <p className="wp-card-title">Identificação</p>
              <div className="wp-stack-sm">
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Slug</div>
                  <div style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>{s.slug}</div>
                </div>
                <div className="wp-divider" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`wp-badge ${s.status === "open" ? "wp-badge-green" : "wp-badge-amber"}`}>
                      {s.status === "open" ? "Aberta" : s.status === "closed" ? "Fechada" : s.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="wp-note wp-note-info" style={{ fontSize: 13 }}>
              Horários de funcionamento e zonas de entrega disponíveis na V2.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
