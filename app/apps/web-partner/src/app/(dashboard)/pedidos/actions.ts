"use server";

import { revalidatePath } from "next/cache";

import { fetchAPI } from "../../../lib/api";

export async function atualizarStatusPedido(id: string, status: string) {
  await fetchAPI(`/partner/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
  revalidatePath("/pedidos");
}
