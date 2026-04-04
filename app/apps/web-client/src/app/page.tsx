import { fetchStorefront } from "../lib/api";
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

export default async function HomePage() {
  const [config, categories, products] = await Promise.all([
    fetchStorefront<StorefrontConfig>("/storefront/config"),
    fetchStorefront<Category[]>("/catalog/categories"),
    fetchStorefront<Product[]>("/catalog/products"),
  ]);

  return (
    <>
      <AgeGate />

      {/* Hero */}
      <section
        style={{
          background: "var(--blue)",
          color: "#fff",
          borderRadius: "var(--radius-lg)",
          padding: "40px 32px",
          marginBottom: 32,
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800 }}>
          {config.branding.name}
        </h1>
        <p style={{ margin: "0 0 24px", opacity: 0.8 }}>
          Bebidas e produtos selecionados com entrega rápida.
        </p>
        {config.status !== "open" && (
          <div className="wc-note">
            A loja está temporariamente fechada.
          </div>
        )}
      </section>

      {/* Catálogo */}
      <CatalogView categories={categories} products={products} />
    </>
  );
}
