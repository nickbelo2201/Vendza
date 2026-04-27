import type { Categoria } from "@vendza/types";

import { fetchAPI } from "../../../../lib/api";
import { CategoriasClient } from "./CategoriasClient";

async function getCategorias(): Promise<Categoria[]> {
  try {
    return await fetchAPI<Categoria[]>("/partner/categories");
  } catch {
    return [];
  }
}

export default async function CategoriasPage() {
  const categorias = await getCategorias();
  const categoriasPai = categorias.filter((c) => !c.parentCategoryId);

  return <CategoriasClient categorias={categoriasPai} />;
}
