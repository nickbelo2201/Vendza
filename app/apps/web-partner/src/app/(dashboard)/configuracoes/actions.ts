"use server";

import { revalidatePath } from "next/cache";

import { fetchAPI } from "../../../lib/api";

export async function salvarConfiguracoes(dados: {
  name?: string;
  whatsappPhone?: string;
  minimumOrderValueCents?: number;
}) {
  await fetchAPI("/partner/store/settings", {
    method: "PATCH",
    body: dados,
  });
  revalidatePath("/configuracoes");
}

export async function salvarZonasEntrega(zonas: Array<{
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  neighborhoods: string[];
}>) {
  await fetchAPI("/partner/store/delivery-zones", {
    method: "PATCH",
    body: zonas,
  });
  revalidatePath("/configuracoes");
}

export async function salvarHorarios(horarios: unknown) {
  await fetchAPI("/partner/store/hours", {
    method: "PATCH",
    body: horarios,
  });
  revalidatePath("/configuracoes");
}
