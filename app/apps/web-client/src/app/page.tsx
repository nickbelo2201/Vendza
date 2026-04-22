import type { StorefrontConfig, StorefrontCategory, ProdutoStorefront, PaginatedResponse } from "@vendza/types";

import { fetchStorefrontCatalog, fetchStorefrontConfig } from "../lib/api";
import { AgeGate } from "../components/AgeGate";
import { CatalogView } from "../components/CatalogView";

type ProductsResponse = PaginatedResponse<ProdutoStorefront>;

export async function generateMetadata() {
  try {
    const config = await fetchStorefrontConfig<{ branding: { name: string } }>("/storefront/config");
    return {
      title: `${config.branding.name} — Delivery`,
      description: `Peça agora no ${config.branding.name}. Entrega rápida na sua região.`,
      openGraph: {
        title: `${config.branding.name} — Delivery`,
        description: `Peça agora no ${config.branding.name}.`,
      },
    };
  } catch {
    return { title: "Vendza — Delivery" };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; categoria?: string }>;
}) {
  const { busca, categoria } = await searchParams;

  const produtosParams = new URLSearchParams();
  if (busca) produtosParams.set("search", busca);
  if (categoria) produtosParams.set("category", categoria);
  const produtosUrl = `/catalog/products${produtosParams.toString() ? `?${produtosParams.toString()}` : ""}`;

  const configFallback: StorefrontConfig = {
    id: "",
    branding: { name: "Vendza", slug: "", logoUrl: null },
    status: "open",
    minimumOrderValueCents: 0,
  };

  let config = configFallback;
  let categories: StorefrontCategory[] = [];
  let products: ProdutoStorefront[] = [];

  try {
    const [configResult, categoriesResult, productsResult] = await Promise.all([
      fetchStorefrontConfig<StorefrontConfig>("/storefront/config"),
      fetchStorefrontCatalog<StorefrontCategory[]>("/catalog/categories"),
      fetchStorefrontCatalog<ProductsResponse>(produtosUrl),
    ]);
    config = configResult;
    categories = categoriesResult;
    products = productsResult.items;
  } catch {
    // API indisponível — exibe estado vazio
  }

  const produtosExibidos: ProdutoStorefront[] = products;

  return (
    <>
      <AgeGate />

      {config.status !== "open" && (
        <div className="wc-note" style={{ marginBottom: 24 }}>
          A loja está temporariamente fechada.
        </div>
      )}

      <CatalogView
        categories={categories}
        products={produtosExibidos}
        categoriaInicial={categoria ?? null}
        termoBusca={busca ?? ""}
      />
    </>
  );
}
