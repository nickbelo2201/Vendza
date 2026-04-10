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

export async function criarProduto(body: {
  name: string;
  slug: string;
  categoryId?: string;
  listPriceCents: number;
  salePriceCents?: number | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
}) {
  await fetchAPI("/partner/products", {
    method: "POST",
    body,
  });
  revalidatePath("/catalogo");
}

export async function editarProduto(id: string, body: {
  name?: string;
  slug?: string;
  categoryId?: string;
  listPriceCents?: number;
  salePriceCents?: number | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
}) {
  await fetchAPI(`/partner/products/${id}`, {
    method: "PATCH",
    body,
  });
  revalidatePath("/catalogo");
}

export async function deletarProduto(id: string) {
  await fetchAPI(`/partner/products/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/catalogo");
}
