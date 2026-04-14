"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";
import { ProductImage } from "./ProductImage";

import { useCarrinho } from "../context/CarrinhoContext";
import { BRANDS, type Brand } from "../data/brands";

const EMOJI_POR_SLUG: Record<string, string> = {
  cervejas: "🍺",
  vinhos: "🍷",
  destilados: "🥃",
  "nao-alcoolicos": "🧃",
  "sem-alcool": "🧃",
  "agua-gelo": "💧",
  "bebidas-quentes": "☕",
  snacks: "🍟",
  petiscos: "🥜",
  mercearia: "🛒",
  presentes: "🎁",
  churrasco: "🥩",
  hortifruti: "🥬",
  laticinios: "🧀",
  padaria: "🍞",
  limpeza: "🧹",
  higiene: "🧴",
};

function CategoryCarouselItem({ category, isActive, onClick }: {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`wc-cat-item${isActive ? " wc-cat-item--active" : ""}`}
      onClick={onClick}
    >
      <div className="wc-cat-icon">
        <span style={{ fontSize: 28, lineHeight: 1 }}>
          {EMOJI_POR_SLUG[category.slug] ?? "🛍️"}
        </span>
      </div>
      <span className="wc-cat-label">{category.name}</span>
    </button>
  );
}

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
  categoriaInicial?: string | null;
  termoBusca?: string;
};

function BrandCard({ brand }: { brand: Brand }) {
  const [imgError, setImgError] = useState(false);
  const showLogo = brand.logoUrl && !imgError;
  return (
    <div
      style={{
        background: brand.bgColor,
        borderRadius: 14,
        height: 88,
        minWidth: 210,
        flexShrink: 0,
        scrollSnapAlign: "start",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${brand.bgColor}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Brilho radial no canto superior esquerdo */}
      <div style={{
        position: "absolute",
        top: -30,
        left: -30,
        width: 120,
        height: 120,
        background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Linha de luz horizontal no topo */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Vinheta nas bordas */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)",
        pointerEvents: "none",
      }} />

      {/* Conteúdo centralizado */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}>
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoUrl!}
            alt={brand.name}
            style={{
              maxHeight: 52,
              maxWidth: 170,
              objectFit: "contain",
              ...(brand.logoWhite ? { filter: "brightness(0) invert(1)" } : {}),
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ color: brand.textColor, fontWeight: 700, fontSize: 20 }}>
            {brand.name}
          </span>
        )}
      </div>
    </div>
  );
}

export function CatalogView({ categories, products, categoriaInicial = null, termoBusca = "" }: Props) {
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(categoriaInicial);
  const { adicionarItem } = useCarrinho();

  const produtosFiltrados = filtroCategoria
    ? products.filter((p) => p.category?.slug === filtroCategoria)
    : products;

  function toggleCategoria(slug: string) {
    setFiltroCategoria((atual) => (atual === slug ? null : slug));
  }

  return (
    <section>
      {/* Carrossel de categorias */}
      <div className="wc-category-carousel-wrapper">
        {/* Botão seta esquerda — só no desktop */}
        <button
          className="wc-carousel-arrow wc-carousel-arrow--left"
          onClick={() => {
            const el = document.getElementById("wc-cat-scroll");
            if (el) el.scrollBy({ left: -200, behavior: "smooth" });
          }}
          aria-label="Anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Track do carrossel */}
        <div className="wc-category-carousel" id="wc-cat-scroll">
          {/* Item "Todos" sempre primeiro */}
          <button
            className={`wc-cat-item${!filtroCategoria ? " wc-cat-item--active" : ""}`}
            onClick={() => setFiltroCategoria(null)}
          >
            <div className="wc-cat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <span className="wc-cat-label">Todos</span>
          </button>

          {/* Categorias da API */}
          {categories.map((cat) => (
            <CategoryCarouselItem
              key={cat.id}
              category={cat}
              isActive={filtroCategoria === cat.slug}
              onClick={() => toggleCategoria(cat.slug)}
            />
          ))}
        </div>

        {/* Botão seta direita — só no desktop */}
        <button
          className="wc-carousel-arrow wc-carousel-arrow--right"
          onClick={() => {
            const el = document.getElementById("wc-cat-scroll");
            if (el) el.scrollBy({ left: 200, behavior: "smooth" });
          }}
          aria-label="Próximo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
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

      {produtosFiltrados.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: 0.4 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>
            {termoBusca
              ? `Nenhum produto encontrado para "${termoBusca}"`
              : "Nenhum produto nesta categoria"}
          </p>
          {termoBusca && (
            <a href="/" style={{ color: "var(--green)", fontSize: 14 }}>
              Limpar busca
            </a>
          )}
        </div>
      )}

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
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  categorySlug={product.category?.slug}
                />
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
