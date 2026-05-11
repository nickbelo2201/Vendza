"use server";

import { revalidatePath } from "next/cache";

import { fetchAPI } from "../../../lib/api";

type HorarioDia = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

// ─── Aba Loja ────────────────────────────────────────────────────────────────

export async function salvarConfiguracoes(dados: {
  name?: string;
  whatsappPhone?: string;
  status?: "open" | "closed" | "paused";
  minimumOrderValueCents?: number;
  logoUrl?: string | null;
}) {
  await fetchAPI("/partner/configuracoes/loja", {
    method: "PUT",
    body: dados,
  });
  revalidatePath("/configuracoes");
}

// ─── Aba Endereço ────────────────────────────────────────────────────────────

export async function salvarEndereco(dados: {
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressComplement?: string | null;
}) {
  await fetchAPI("/partner/configuracoes/loja", {
    method: "PUT",
    body: dados,
  });
  revalidatePath("/configuracoes");
}

// ─── Aba Zonas de Entrega ─────────────────────────────────────────────────────

type ZonaPayload = {
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

export async function salvarZonasEntrega(
  zonas: ZonaPayload[],
  zonasRemovidas: string[]
) {
  // Deletar zonas removidas que tinham id
  for (const id of zonasRemovidas) {
    await fetchAPI(`/partner/configuracoes/zonas-entrega/${id}`, {
      method: "DELETE",
    });
  }

  // Criar ou atualizar zonas individualmente
  for (const zona of zonas) {
    const { id, ...body } = zona;
    if (id) {
      await fetchAPI(`/partner/configuracoes/zonas-entrega/${id}`, {
        method: "PUT",
        body,
      });
    } else {
      await fetchAPI("/partner/configuracoes/zonas-entrega", {
        method: "POST",
        body,
      });
    }
  }

  revalidatePath("/configuracoes");
}

// ─── Aba Horários ─────────────────────────────────────────────────────────────

export async function salvarHorarios(horarios: HorarioDia[]) {
  await fetchAPI("/partner/configuracoes/horarios", {
    method: "PUT",
    body: horarios,
  });
  revalidatePath("/configuracoes");
}

// ─── Toggle rápido de status (usado no header) ────────────────────────────────

export async function toggleStatusLoja(status: "open" | "closed") {
  await fetchAPI("/partner/configuracoes/loja", {
    method: "PUT",
    body: { status },
  });
  revalidatePath("/");
  revalidatePath("/configuracoes");
}

// ─── Aba Dados Bancários ──────────────────────────────────────────────────────

export async function salvarDadosBancarios(dados: {
  keyType: string;
  pixKey: string;
  bankName: string | null;
}) {
  await fetchAPI("/partner/configuracoes/conta-bancaria", {
    method: "PUT",
    body: dados,
  });
  revalidatePath("/configuracoes");
}

// ─── Aba Usuários ─────────────────────────────────────────────────────────────

export async function convidarUsuario(dados: {
  email: string;
  role: string;
}) {
  await fetchAPI("/partner/configuracoes/usuarios/convidar", {
    method: "POST",
    body: dados,
  });
  revalidatePath("/configuracoes");
}

export async function revogarUsuario(storeUserId: string) {
  await fetchAPI(`/partner/configuracoes/usuarios/${storeUserId}`, {
    method: "DELETE",
  });
  revalidatePath("/configuracoes");
}
