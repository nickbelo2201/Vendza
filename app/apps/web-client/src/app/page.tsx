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

export default async function HomePage() {
  const [config, categories, products] = await Promise.all([
    fetchStorefrontConfig<StorefrontConfig>("/storefront/config"),
    fetchStorefrontCatalog<Category[]>("/catalog/categories"),
    fetchStorefrontCatalog<Product[]>("/catalog/products"),
  ]);

  // Usa produtos de demonstração quando o catálogo está vazio
  const produtosExibidos: Product[] =
    products.length > 0 ? products : MOCK_PRODUCTS;

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
