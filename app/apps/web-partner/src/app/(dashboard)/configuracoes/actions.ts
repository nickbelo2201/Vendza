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
