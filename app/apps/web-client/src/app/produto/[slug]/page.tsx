import { notFound } from "next/navigation";
import { formatCurrency } from "@vendza/utils";

import { fetchStorefront } from "../../../lib/api";
import { BotaoAdicionarAoCarrinho } from "../../../components/BotaoAdicionarAoCarrinho";

type Produto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  offer: boolean;
  categorySlug: string | null;
  category: { id: string; name: string; slug: string } | null;
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let produto: Produto;
  try {
    produto = await fetchStorefront<Produto>(`/catalog/products/${slug}`);
  } catch {
    notFound();
  }

  const preco = produto.salePriceCents ?? produto.listPriceCents;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <a href="/" className="wc-btn wc-btn-secondary" style={{ display: "inline-flex" }}>
          ← Voltar ao catálogo
        </a>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div className="wc-card">
          <div
            className="wc-product-image"
            style={{ marginBottom: 20, height: 240 }}
          >
            {produto.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={produto.imageUrl}
                alt={produto.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span>Sem imagem</span>
            )}
          </div>

          {produto.category && (
            <span className="wc-badge wc-badge-blue" style={{ marginBottom: 12, display: "inline-flex" }}>
              {produto.category.name}
            </span>
          )}

          <h1 style={{ margin: "8px 0", color: "var(--carbon)" }}>{produto.name}</h1>

          <div className="wc-price" style={{ margin: "16px 0" }}>
            <span className="wc-price-now">{formatCurrency(preco)}</span>
            {produto.offer && produto.salePriceCents !== null && (
              <span className="wc-price-old">{formatCurrency(produto.listPriceCents)}</span>
            )}
          </div>

          {produto.description && (
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>{produto.description}</p>
          )}
        </div>

        <div className="wc-card wc-stack">
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Preço unitário: <strong style={{ color: "var(--carbon)" }}>{formatCurrency(preco)}</strong>
          </p>

          <BotaoAdicionarAoCarrinho
            productId={produto.id}
            name={produto.name}
            slug={produto.slug}
            imageUrl={produto.imageUrl}
            unitPriceCents={preco}
          />

          <a href="/checkout" className="wc-btn wc-btn-secondary" style={{ textAlign: "center" }}>
            Ir para checkout
          </a>
        </div>
      </div>
    </div>
  );
}
