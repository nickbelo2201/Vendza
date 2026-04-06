"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";
import { ProductImage } from "./ProductImage";

import { useCarrinho } from "../context/CarrinhoContext";
import { CATEGORIES } from "../data/categories";
import { BRANDS, type Brand } from "../data/brands";

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

type Props = {
  categories: Category[];
  products: Product[];
};

function BrandCard({ brand }: { brand: Brand }) {
  const [imgError, setImgError] = useState(false);
  const showLogo = brand.logoUrl && !imgError;
  return (
    <div className="wc-brand-card" style={{ background: brand.bgColor }}>
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoUrl!}
          alt={brand.name}
          style={brand.logoWhite ? { filter: "brightness(0) invert(1)" } : undefined}
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={{ color: brand.textColor, fontWeight: 700, fontSize: 20 }}>
          {brand.name}
        </span>
      )}
    </div>
  );
}

export function CatalogView({ categories, products }: Props) {
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const { adicionarItem } = useCarrinho();

  const produtosFiltrados = filtroCategoria
    ? products.filter((p) => p.category?.slug === filtroCategoria)
    : products;

  function toggleCategoria(slug: string) {
    setFiltroCategoria((atual) => (atual === slug ? null : slug));
  }

  return (
    <section>
      {/* Grade de categorias — dados estáticos */}
      <div className="wc-category-grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`wc-category-card${filtroCategoria === cat.id ? " active" : ""}`}
            onClick={() => toggleCategoria(cat.id)}
            title={cat.label}
          >
            <div className="wc-category-icon">
              <cat.Icon size={28} strokeWidth={1.5} />
            </div>
            <span className="wc-category-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Chips de subcategoria — dados da API */}
      <div className="wc-subcategory-row">
        <button
          className={`wc-subcategory-chip${filtroCategoria === null ? " active" : ""}`}
          onClick={() => setFiltroCategoria(null)}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`wc-subcategory-chip${filtroCategoria === cat.slug ? " active" : ""}`}
            onClick={() => toggleCategoria(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Marcas que Amamos */}
      <p className="wc-section-title">Marcas que Amamos</p>
      <div className="wc-brand-carousel">
        {BRANDS.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>

      {/* Recomendados para Você */}
      <p className="wc-section-title-sm">Recomendados para Você</p>

      <div className="wc-product-grid">
        {produtosFiltrados.map((product) => {
          const preco = product.salePriceCents ?? product.listPriceCents;
          const desconto =
            product.offer && product.salePriceCents !== null
              ? Math.round(
                  (1 - product.salePriceCents / product.listPriceCents) * 100
                )
              : null;

          return (
            <div key={product.id} className="wc-product-card">
              <div className="wc-product-image">
                {desconto !== null && (
                  <span className="wc-badge-discount">-{desconto}%</span>
                )}
                {product.isFeatured && (
                  <span className="wc-badge-new">Novo</span>
                )}
                <ProductImage src={product.imageUrl} alt={product.name} />
              </div>

              <div className="wc-product-info">
                <a href={`/produto/${product.slug}`} className="wc-product-name">
                  {product.name}
                </a>

                <div className="wc-price">
                  <span className="wc-price-now">{formatCurrency(preco)}</span>
                  {product.offer && product.salePriceCents !== null && (
                    <span className="wc-price-old">
                      {formatCurrency(product.listPriceCents)}
                    </span>
                  )}
                </div>

                <button
                  className="wc-btn-cta"
                  onClick={() =>
                    adicionarItem({
                      productId: product.id,
                      name: product.name,
                      slug: product.slug,
                      imagemUrl: product.imageUrl,
                      unitPriceCents: preco,
                    })
                  }
                >
                  Adicionar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {produtosFiltrados.length === 0 && (
        <p
          style={{
            color: "var(--color-text-muted)",
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          Nenhum produto encontrado nesta categoria.
        </p>
      )}
    </section>
  );
}
