import { fetchStorefrontCatalog, fetchStorefrontConfig } from "../lib/api";
import { AgeGate } from "../components/AgeGate";
import { CatalogView } from "../components/CatalogView";
import { MOCK_PRODUCTS } from "../data/products";

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
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca } = await searchParams;

  // Monta a URL de produtos com o parâmetro de busca quando presente
  const produtosUrl = busca
    ? `/catalog/products?search=${encodeURIComponent(busca)}`
    : "/catalog/products";

  const [config, categories, products] = await Promise.all([
    fetchStorefrontConfig<StorefrontConfig>("/storefront/config"),
    fetchStorefrontCatalog<Category[]>("/catalog/categories"),
    fetchStorefrontCatalog<Product[]>(produtosUrl),
  ]);

  // Usa produtos de demonstração quando o catálogo está vazio e não há busca ativa
  const produtosExibidos: Product[] =
    products.length > 0 ? products : busca ? [] : MOCK_PRODUCTS;

  return (
    <>
      <AgeGate />

      {config.status !== "open" && (
        <div className="wc-note" style={{ marginBottom: 24 }}>
          A loja está temporariamente fechada.
        </div>
      )}

      <CatalogView categories={categories} products={produtosExibidos} />
    </>
  );
}
