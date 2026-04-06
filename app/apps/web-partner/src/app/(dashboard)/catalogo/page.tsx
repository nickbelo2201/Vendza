import { ApiError, fetchAPI } from "../../../lib/api";
import { CatalogoClient } from "./CatalogoClient";

type Categoria = { id: string; name: string; slug: string };

type Produto = {
  id: string; name: string; slug: string;
  categoryId: string; categorySlug: string;
  listPriceCents: number; salePriceCents: number | null;
  imageUrl: string | null;
  isAvailable: boolean; isFeatured: boolean;
};

async function getProdutos(): Promise<Produto[]> {
  try { return await fetchAPI<Produto[]>("/partner/products"); }
  catch (err) { if (err instanceof ApiError) return []; return []; }
}

async function getCategorias(): Promise<Categoria[]> {
  try { return await fetchAPI<Categoria[]>("/partner/categories"); }
  catch { return []; }
}

export default async function CatalogPage() {
  const [produtos, categorias] = await Promise.all([getProdutos(), getCategorias()]);

  return (
    <div className="wp-stack-lg">
      <CatalogoClient produtos={produtos} categorias={categorias} />
    </div>
  );
}
