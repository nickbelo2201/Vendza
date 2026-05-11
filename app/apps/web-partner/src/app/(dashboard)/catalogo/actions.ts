"use server";

import { revalidatePath } from "next/cache";
import type { ProdutosResponse } from "@vendza/types";

import { ApiError, fetchAPI } from "../../../lib/api";

export async function buscarProdutos(params: {
  busca?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  pagina?: number;
  limite?: number;
}): Promise<ProdutosResponse> {
  const searchParams = new URLSearchParams();
  if (params.busca) searchParams.set("busca", params.busca);
  if (params.categoriaId) searchParams.set("categoriaId", params.categoriaId);
  if (params.subcategoriaId) searchParams.set("subcategoriaId", params.subcategoriaId);
  searchParams.set("pagina", String(params.pagina ?? 1));
  searchParams.set("limite", String(params.limite ?? 20));

  try {
    return await fetchAPI<ProdutosResponse>(`/partner/products?${searchParams.toString()}`);
  } catch {
    return { produtos: [], total: 0, pagina: 1, limite: 20, totalPaginas: 0 };
  }
}

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
  barcode?: string | null;
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
  barcode?: string | null;
}) {
  await fetchAPI(`/partner/products/${id}`, {
    method: "PATCH",
    body,
  });
  revalidatePath("/catalogo");
}

export async function deletarProduto(id: string) {
  try {
    await fetchAPI(`/partner/products/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    throw new Error(`Falha ao deletar produto (HTTP ${status})`);
  }
  revalidatePath("/catalogo");
}
