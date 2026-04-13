import { ApiError, fetchAPI } from "../../../lib/api";
import { ConfigNavLateral } from "./ConfigNavLateral";
import { DadosBancarios } from "./DadosBancarios";
import { FormConfiguracoes } from "./FormConfiguracoes";
import { HorariosForm } from "./HorariosForm";
import { UsuariosConfig } from "./UsuariosConfig";
import { MapaZonasEntrega } from "./MapaZonasEntrega";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StoreSettings = {
  id: string;
  name: string;
  slug: string;
  whatsappPhone: string;
  status: string;
  minimumOrderValueCents: number;
};

type Zona = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  mode: "radius" | "neighborhoods";
  radiusKm?: number | null;
  centerLat?: number | null;
  centerLng?: number | null;
  neighborhoods: string[];
  minimumOrderCents: number;
  freeShippingAboveCents: number;
};

type HorarioDia = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

type ContaBancaria = {
  keyType: string;
  lastFourDigits: string | null;
  bankName: string | null;
};

type UsuarioStore = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type SessaoAtual = {
  userId: string;
};

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getSettings(): Promise<StoreSettings | null> {
  try {
    return await fetchAPI<StoreSettings>("/partner/store/settings");
  } catch (err) {
    if (err instanceof ApiError) return null;
    return null;
  }
}

async function getZonas(): Promise<Zona[]> {
  try {
    return await fetchAPI<Zona[]>("/partner/store/delivery-zones");
  } catch {
    return [];
  }
}

async function getHorarios(): Promise<HorarioDia[]> {
  try {
    return await fetchAPI<HorarioDia[]>("/partner/store/hours");
  } catch {
    return [];
  }
}

async function getContaBancaria(): Promise<ContaBancaria | null> {
  try {
    return await fetchAPI<ContaBancaria>("/partner/configuracoes/conta-bancaria");
  } catch {
    return null;
  }
}

async function getUsuarios(): Promise<UsuarioStore[]> {
  try {
    return await fetchAPI<UsuarioStore[]>("/partner/configuracoes/usuarios");
  } catch {
    return [];
  }
}

async function getSessaoAtual(): Promise<SessaoAtual | null> {
  try {
    return await fetchAPI<SessaoAtual>("/partner/me");
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const [s, zonas, horarios, conta, usuarios, sessao] = await Promise.all([
    getSettings(),
    getZonas(),
    getHorarios(),
    getContaBancaria(),
    getUsuarios(),
    getSessaoAtual(),
  ]);

  return (
    <>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Tablet: 768px - 1200px */
        @media (max-width: 1200px) {
          .conf-layout {
            flex-direction: column !important;
          }
          .conf-nav-lateral {
            display: none !important;
          }
          .conf-nav-dropdown {
            display: block !important;
            margin-bottom: 16px;
          }
          .conf-2col {
            grid-template-columns: 1fr !important;
          }
          .conf-mapa-layout {
            flex-direction: column !important;
            height: auto !important;
          }
          .conf-mapa-map {
            flex: none !important;
            height: 300px !important;
            width: 100% !important;
          }
          .conf-mapa-panel {
            flex: none !important;
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--border) !important;
          }
        }

        /* Mobile: < 768px */
        @media (max-width: 768px) {
          .conf-input {
            min-height: 44px !important;
          }
          .conf-btn-save {
            position: sticky;
            bottom: 0;
            z-index: 10;
            width: 100%;
            padding: 12px 16px;
            background: var(--surface);
            border-top: 1px solid var(--border);
            margin: 0 -20px;
          }
        }

        /* Dropdown da nav — oculto por padrão (desktop) */
        .conf-nav-dropdown {
          display: none;
        }
      `}</style>

      <div className="wp-stack-lg">
        <div className="wp-page-header">
          <h1>Configurações</h1>
          <p>Gerencie os dados, horários, conta bancária e usuários da loja.</p>
        </div>

        <div className="conf-layout" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Nav lateral sticky — desktop */}
          <ConfigNavLateral />

          {/* Cards em sequência */}
          <div className="wp-stack-lg" style={{ flex: 1, minWidth: 0 }}>
            <section id="loja">
              {!s ? (
                <div className="wp-note">
                  Não foi possível carregar as configurações. Verifique a conexão com a API.
                </div>
              ) : (
                <FormConfiguracoes
                  settings={{
                    name: s.name,
                    slug: s.slug,
                    whatsappPhone: s.whatsappPhone ?? "",
                    status: s.status,
                    minimumOrderValueCents: s.minimumOrderValueCents,
                  }}
                />
              )}
            </section>

            <section id="horarios">
              <HorariosForm initialHours={horarios && horarios.length > 0 ? horarios : null} />
            </section>

            <section id="dados-bancarios">
              <DadosBancarios conta={conta ?? null} />
            </section>

            <section id="zonas">
              <MapaZonasEntrega zonas={zonas ?? []} />
            </section>

            <section id="usuarios">
              <UsuariosConfig
                usuarios={usuarios ?? []}
                currentUserId={sessao?.userId ?? ""}
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
