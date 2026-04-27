import type { Categoria } from "@vendza/types";

import { fetchAPI } from "../../../../lib/api";
import { SubcategoriasClient } from "./SubcategoriasClient";

async function getCategorias(): Promise<Categoria[]> {
  try {
    return await fetchAPI<Categoria[]>("/partner/categories");
  } catch {
    return [];
  }
}

export default async function SubcategoriasPage() {
  const categorias = await getCategorias();
  return <SubcategoriasClient categorias={categorias} />;
}
