import { notFound } from "next/navigation";
import { formatCurrency } from "@vendza/utils";
import type { ProdutoStorefront } from "@vendza/types";

import { fetchStorefrontCatalog, fetchStorefrontConfig } from "../../../lib/api";
import { BotaoAdicionarAoCarrinho } from "../../../components/BotaoAdicionarAoCarrinho";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const [product, config] = await Promise.all([
      fetchStorefrontCatalog<{ name: string; imageUrl: string | null; category: { name: string } | null }>(
        `/catalog/products/${slug}`
      ),
      fetchStorefrontConfig<{ branding: { name: string } }>("/storefront/config"),
    ]);
    const ogImages = product.imageUrl
      ? [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }]
      : [{ url: "/opengraph-image", width: 1200, height: 630, alt: config.branding.name }];
    return {
      title: `${product.name} — ${config.branding.name}`,
      description: `${product.name}${product.category ? ` — ${product.category.name}` : ""}. Peça agora.`,
      openGraph: {
        type: "website",
        title: `${product.name} — ${config.branding.name}`,
        description: `${product.name}${product.category ? ` — ${product.category.name}` : ""}. Peça agora.`,
        siteName: config.branding.name,
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image" as const,
        title: `${product.name} — ${config.branding.name}`,
        description: `${product.name}${product.category ? ` — ${product.category.name}` : ""}. Peça agora.`,
        images: product.imageUrl ? [product.imageUrl] : ["/opengraph-image"],
      },
    };
  } catch {
    return { title: "Vendza" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let produto: ProdutoStorefront;
  try {
    produto = await fetchStorefrontCatalog<ProdutoStorefront>(`/catalog/products/${slug}`);
  } catch {
    notFound();
  }

  const preco = produto.salePriceCents ?? produto.listPriceCents;

  return (
    <div>
      <nav style={{ marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <a href="/" style={{ color: 'var(--green)', textDecoration: 'none' }}>Início</a>
        {produto.category && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <a href={`/?categoria=${produto.category.slug}`} style={{ color: 'var(--green)', textDecoration: 'none' }}>
              {produto.category.name}
            </a>
          </>
        )}
        <span style={{ color: 'var(--text-muted)' }}>›</span>
        <span style={{ color: 'var(--text-muted)' }}>{produto.name}</span>
      </nav>

      <div
        className="wc-checkout-layout"
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

          <h1 style={{ marginTop: 8, marginBottom: 0 }}>{produto.name}</h1>

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
