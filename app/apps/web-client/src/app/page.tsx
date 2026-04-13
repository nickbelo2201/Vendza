import { fetchStorefrontCatalog, fetchStorefrontConfig } from "../lib/api";
import { AgeGate } from "../components/AgeGate";
import { CatalogView } from "../components/CatalogView";

type StorefrontConfig = {
  id: string;
  branding: { name: string; slug: string; logoUrl: string | null };
  status: string;
  minimumOrderValueCents: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  isFeatured: boolean;
  offer: boolean;
  category: { id: string; name: string; slug: string } | null;
};

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
  let categories: Category[] = [];
  let products: Product[] = [];

  try {
    [config, categories, products] = await Promise.all([
      fetchStorefrontConfig<StorefrontConfig>("/storefront/config"),
      fetchStorefrontCatalog<Category[]>("/catalog/categories"),
      fetchStorefrontCatalog<Product[]>(produtosUrl),
    ]);
  } catch {
    // API indisponível — exibe estado vazio
  }

  const produtosExibidos: Product[] = products;

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
