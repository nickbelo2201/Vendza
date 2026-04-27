import type { Categoria, ProdutosResponse } from "@vendza/types";

import { ApiError, fetchAPI } from "../../../../lib/api";
import { CatalogoClient } from "../CatalogoClient";

async function getProdutos(): Promise<ProdutosResponse> {
  try {
    return await fetchAPI<ProdutosResponse>("/partner/products?limite=20&pagina=1");
  } catch (err) {
    if (err instanceof ApiError) return { produtos: [], total: 0, pagina: 1, limite: 20, totalPaginas: 0 };
    return { produtos: [], total: 0, pagina: 1, limite: 20, totalPaginas: 0 };
  }
}

async function getCategorias(): Promise<Categoria[]> {
  try {
    return await fetchAPI<Categoria[]>("/partner/categories");
  } catch {
    return [];
  }
}

export default async function ProdutosPage() {
  const [produtosResp, categorias] = await Promise.all([getProdutos(), getCategorias()]);

  return (
    <div className="wp-stack-lg">
      <CatalogoClient
        produtosIniciais={produtosResp.produtos}
        totalIniciais={produtosResp.total}
        totalPaginasIniciais={produtosResp.totalPaginas}
        categorias={categorias}
      />
    </div>
  );
}
