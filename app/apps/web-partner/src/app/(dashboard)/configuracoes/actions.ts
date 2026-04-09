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
}) {
  await fetchAPI("/partner/store/settings", {
    method: "PATCH",
    body: dados,
  });
  revalidatePath("/configuracoes");
}

// ─── Aba Zonas de Entrega ─────────────────────────────────────────────────────

export async function salvarZonasEntrega(
  zonas: Array<{
    id?: string;
    label: string;
    feeCents: number;
    etaMinutes: number;
    neighborhoods: string[];
  }>
) {
  await fetchAPI("/partner/store/delivery-zones", {
    method: "PATCH",
    body: zonas,
  });
  revalidatePath("/configuracoes");
}

// ─── Aba Horários ─────────────────────────────────────────────────────────────

export async function salvarHorarios(horarios: HorarioDia[]) {
  await fetchAPI("/partner/store/hours", {
    method: "PATCH",
    body: horarios,
  });
  revalidatePath("/configuracoes");
}

// ─── Toggle rápido de status (usado no header) ────────────────────────────────

export async function toggleStatusLoja(status: "open" | "closed") {
  await fetchAPI("/partner/store/settings", {
    method: "PATCH",
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
