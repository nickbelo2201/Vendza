import Link from "next/link";

import { ApiError, fetchAPI } from "../../../lib/api";
import { DadosBancarios } from "./DadosBancarios";
import { FormConfiguracoes } from "./FormConfiguracoes";
import { HorariosForm } from "./HorariosForm";
import { UsuariosConfig } from "./UsuariosConfig";
import { ZonasEntrega } from "./ZonasEntrega";

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
  neighborhoods: string[];
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

// ─── Abas ─────────────────────────────────────────────────────────────────────

const ABAS = [
  { id: "loja", label: "Loja" },
  { id: "horarios", label: "Horários" },
  { id: "dados-bancarios", label: "Dados Bancários" },
  { id: "usuarios", label: "Usuários" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

function isAbaValida(v: string | undefined): v is AbaId {
  return ABAS.some((a) => a.id === v);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const params = await searchParams;
  const abaAtiva: AbaId = isAbaValida(params.aba) ? params.aba : "loja";

  // Carrega dados de acordo com a aba ativa para evitar fetches desnecessários
  const [s, zonas, horarios, conta, usuarios, sessao] = await Promise.all([
    abaAtiva === "loja" ? getSettings() : null,
    abaAtiva === "loja" ? getZonas() : null,
    abaAtiva === "horarios" ? getHorarios() : null,
    abaAtiva === "dados-bancarios" ? getContaBancaria() : null,
    abaAtiva === "usuarios" ? getUsuarios() : null,
    abaAtiva === "usuarios" ? getSessaoAtual() : null,
  ]);

  return (
    <>
      <style>{`
        .conf-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 28px;
        }
        .conf-tab-btn {
          background: none;
          border: none;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          text-decoration: none;
          display: inline-block;
          transition: color 0.15s, background 0.15s;
          position: relative;
          bottom: -2px;
          border-bottom: 2px solid transparent;
        }
        .conf-tab-btn:hover {
          color: var(--carbon);
          background: var(--cream);
        }
        .conf-tab-btn[data-active="true"] {
          color: var(--green);
          font-weight: 600;
          border-bottom: 2px solid var(--green);
          background: none;
        }
      `}</style>

      <div className="wp-stack-lg">
        <div className="wp-page-header">
          <h1>Configurações</h1>
          <p>Gerencie os dados, horários, conta bancária e usuários da loja.</p>
        </div>

        {/* Navegação de abas */}
        <nav className="conf-tabs" aria-label="Seções de configurações">
          {ABAS.map((aba) => (
            <Link
              key={aba.id}
              href={`/configuracoes?aba=${aba.id}`}
              className="conf-tab-btn"
              data-active={abaAtiva === aba.id ? "true" : "false"}
            >
              {aba.label}
            </Link>
          ))}
        </nav>

        {/* ─── Aba Loja ─── */}
        {abaAtiva === "loja" && (
          <>
            {!s ? (
              <div className="wp-note">
                Não foi possível carregar as configurações. Verifique a conexão com a API.
              </div>
            ) : (
              <div className="wp-stack-lg">
                <div className="wp-panel">
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
                    Dados da loja
                  </h2>
                  <FormConfiguracoes
                    settings={{
                      name: s.name,
                      slug: s.slug,
                      whatsappPhone: s.whatsappPhone ?? "",
                      status: s.status,
                      minimumOrderValueCents: s.minimumOrderValueCents,
                    }}
                  />
                </div>

                <ZonasEntrega zonas={zonas ?? []} />
              </div>
            )}
          </>
        )}

        {/* ─── Aba Horários ─── */}
        {abaAtiva === "horarios" && (
          <HorariosForm initialHours={horarios && horarios.length > 0 ? horarios : null} />
        )}

        {/* ─── Aba Dados Bancários ─── */}
        {abaAtiva === "dados-bancarios" && <DadosBancarios conta={conta ?? null} />}

        {/* ─── Aba Usuários ─── */}
        {abaAtiva === "usuarios" && (
          <UsuariosConfig
            usuarios={usuarios ?? []}
            currentUserId={sessao?.userId ?? ""}
          />
        )}
      </div>
    </>
  );
}
