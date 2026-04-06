import { ApiError, fetchAPI } from "../../../lib/api";
import { FormConfiguracoes } from "./FormConfiguracoes";
import { ZonasEntrega } from "./ZonasEntrega";
import { HorariosForm } from "./HorariosForm";

type StoreSettings = {
  id: string; name: string; slug: string;
  whatsappPhone: string; status: string; minimumOrderValueCents: number;
};

type Zona = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  neighborhoods: string[];
};

type HorarioDia = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

async function getSettings(): Promise<StoreSettings | null> {
  try { return await fetchAPI<StoreSettings>("/partner/store/settings"); }
  catch (err) { if (err instanceof ApiError) return null; return null; }
}

async function getZonas(): Promise<Zona[]> {
  try { return await fetchAPI<Zona[]>("/partner/store/delivery-zones"); }
  catch { return []; }
}

async function getHorarios(): Promise<HorarioDia[]> {
  try { return await fetchAPI<HorarioDia[]>("/partner/store/hours"); }
  catch { return []; }
}

export default async function SettingsPage() {
  const [s, zonas, horarios] = await Promise.all([getSettings(), getZonas(), getHorarios()]);

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
          </div>
        </div>
      )}

      {/* Zonas de entrega */}
      <ZonasEntrega zonas={zonas} />

      {/* Horários de funcionamento */}
      <HorariosForm initialHours={horarios.length > 0 ? horarios : null} />
    </div>
  );
}
