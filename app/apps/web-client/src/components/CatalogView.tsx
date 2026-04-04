"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";

import { useCarrinho } from "../context/CarrinhoContext";

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

export function CatalogView({ categories, products }: Props) {
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const { adicionarItem } = useCarrinho();

  const produtosFiltrados = filtroCategoria
    ? products.filter((p) => p.category?.slug === filtroCategoria)
    : products;

  return (
    <section style={{ marginTop: 32 }}>
      {/* Filtro de categorias */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <button
          className={`wc-btn ${filtroCategoria === null ? "wc-btn-primary" : "wc-btn-secondary"}`}
          onClick={() => setFiltroCategoria(null)}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`wc-btn ${filtroCategoria === cat.slug ? "wc-btn-primary" : "wc-btn-secondary"}`}
            onClick={() => setFiltroCategoria(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de produtos */}
      <div className="wc-product-grid">
        {produtosFiltrados.map((product) => {
          const preco = product.salePriceCents ?? product.listPriceCents;
          return (
            <div key={product.id} className="wc-product-card">
              <div className="wc-product-image">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                  />
                ) : (
                  <span>Sem imagem</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {product.isFeatured && (
                  <span className="wc-badge wc-badge-green">Destaque</span>
                )}
                {product.offer && (
                  <span className="wc-badge wc-badge-amber">Oferta</span>
                )}
              </div>
              <a
                href={`/produto/${product.slug}`}
                style={{ fontWeight: 600, color: "var(--carbon)", display: "block" }}
              >
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
                className="wc-btn wc-btn-primary"
                style={{ width: "100%", marginTop: "auto" }}
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
          );
        })}
      </div>

      {produtosFiltrados.length === 0 && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
          Nenhum produto encontrado nesta categoria.
        </p>
      )}
    </section>
  );
}
