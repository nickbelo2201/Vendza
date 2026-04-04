"use server";

import { revalidatePath } from "next/cache";

import { fetchAPI } from "../../../lib/api";

export async function alterarDisponibilidade(id: string, isAvailable: boolean) {
  await fetchAPI(`/partner/products/${id}/availability`, {
    method: "PATCH",
    body: { isAvailable },
  });
  revalidatePath("/catalogo");
}
