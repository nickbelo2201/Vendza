import { Suspense, ReactNode } from "react";
import { ApiError, fetchAPI } from "../../../lib/api";
import { DadosBancarios } from "./DadosBancarios";
import { FormConfiguracoes } from "./FormConfiguracoes";
import { HorariosForm } from "./HorariosForm";
import { MapaZonasEntrega } from "./MapaZonasEntrega";
import { UsuariosConfig } from "./UsuariosConfig";

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

function SkeletonFallback() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 24,
      marginBottom: 24,
    }}>
      <div style={{
        height: 20,
        background: "var(--border)",
        borderRadius: 8,
        marginBottom: 16,
        animation: "shimmer 1.5s infinite",
      }} />
      <div style={{
        height: 44,
        background: "var(--border)",
        borderRadius: 8,
        marginBottom: 16,
        animation: "shimmer 1.5s infinite",
      }} />
    </div>
  );
}

export function SettingsSuspenseWrapper({
  children,
  fallback = <SkeletonFallback />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

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

export async function SettingsSection() {
  const s = await getSettings();
  return (
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
  );
}

export async function HorariosSection() {
  const horarios = await getHorarios();
  return (
    <section id="horarios">
      <HorariosForm initialHours={horarios && horarios.length > 0 ? horarios : null} />
    </section>
  );
}

export async function ContaBancariaSection() {
  const conta = await getContaBancaria();
  return (
    <section id="dados-bancarios">
      <DadosBancarios conta={conta ?? null} />
    </section>
  );
}

export async function ZonasSection() {
  const zonas = await getZonas();
  return (
    <section id="zonas">
      <MapaZonasEntrega zonas={zonas ?? []} />
    </section>
  );
}

export async function UsuariosSection() {
  const usuarios = await getUsuarios();
  const sessao = await getSessaoAtual();
  return (
    <section id="usuarios">
      <UsuariosConfig
        usuarios={usuarios ?? []}
        currentUserId={sessao?.userId ?? ""}
      />
    </section>
  );
}
