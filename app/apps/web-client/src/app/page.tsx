import type { StorefrontConfig, StorefrontCategory, ProdutoStorefront, PaginatedResponse } from "@vendza/types";

import { fetchStorefrontCatalog, fetchStorefrontConfig } from "../lib/api";
import { AgeGate } from "../components/AgeGate";
import { CatalogView } from "../components/CatalogView";

type ProductsResponse = PaginatedResponse<ProdutoStorefront>;

export async function generateMetadata() {
  try {
    const config = await fetchStorefrontConfig<{ branding: { name: string } }>("/storefront/config");
    const nome = config.branding.name;
    return {
      title: `${nome} — Delivery`,
      description: `Peça agora no ${nome}. Entrega rápida na sua região.`,
      openGraph: {
        type: "website",
        title: `${nome} — Delivery`,
        description: `Peça agora no ${nome}. Entrega rápida na sua região.`,
        siteName: nome,
        images: [
          {
            url: "/opengraph-image",
            width: 1200,
            height: 630,
            alt: `${nome} — Delivery`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image" as const,
        title: `${nome} — Delivery`,
        description: `Peça agora no ${nome}. Entrega rápida na sua região.`,
        images: ["/opengraph-image"],
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

  // Cada chamada é independente — uma falha não derruba as outras
  const [configResult, categoriesResult, productsResult] = await Promise.allSettled([
    fetchStorefrontConfig<StorefrontConfig>("/storefront/config"),
    fetchStorefrontCatalog<StorefrontCategory[]>("/catalog/categories"),
    fetchStorefrontCatalog<ProductsResponse>(produtosUrl),
  ]);

  if (configResult.status === "fulfilled") {
    config = configResult.value;
  } else {
    console.error("[storefront] /storefront/config falhou:", configResult.reason);
  }

  if (categoriesResult.status === "fulfilled") {
    categories = categoriesResult.value;
  } else {
    console.error("[storefront] /catalog/categories falhou:", categoriesResult.reason);
  }

  if (productsResult.status === "fulfilled") {
    products = productsResult.value.items ?? [];
  } else {
    console.error("[storefront] /catalog/products falhou:", productsResult.reason);
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
