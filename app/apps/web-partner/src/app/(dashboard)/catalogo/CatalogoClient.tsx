"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";

import { ProdutoModal } from "./ProdutoModal";
import { BotaoDeletar } from "./BotaoDeletar";
import { DisponibilidadeToggle } from "./DisponibilidadeToggle";
import { ImportarCSVModal } from "./ImportarCSVModal";

type Categoria = { id: string; name: string; slug: string };

type Produto = {
  id: string; name: string; slug: string;
  categoryId: string; categorySlug: string;
  listPriceCents: number; salePriceCents: number | null;
  imageUrl: string | null;
  isAvailable: boolean; isFeatured: boolean;
};

type ProdutoParaEditar = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  listPriceCents: number;
  salePriceCents: number | null;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
};

type Props = {
  produtos: Produto[];
  categorias: Categoria[];
};

export function CatalogoClient({ produtos, categorias }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoParaEditar | null>(null);
  const [importarCSVAberto, setImportarCSVAberto] = useState(false);

  function abrirCriar() {
    setProdutoEditando(null);
    setModalAberto(true);
  }

  function abrirEditar(p: Produto) {
    setProdutoEditando({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId ?? "",
      listPriceCents: p.listPriceCents,
      salePriceCents: p.salePriceCents,
      imageUrl: p.imageUrl ?? "",
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
    });
    setModalAberto(true);
  }

  return (
    <>
      {/* Header com botão Novo Produto */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Catálogo</h1>
            <p>Gerencie produtos e disponibilidade para pedidos.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="wp-badge wp-badge-blue">
              {produtos.length} produto{produtos.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className="wp-btn wp-btn-secondary"
              onClick={() => setImportarCSVAberto(true)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Importar CSV
            </button>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={abrirCriar}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Novo Produto
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {produtos.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <p className="wp-empty-title">Nenhum produto cadastrado</p>
            <p className="wp-empty-desc">Adicione produtos para começar a receber pedidos.</p>
            <button type="button" className="wp-btn wp-btn-primary" onClick={abrirCriar} style={{ marginTop: 12 }}>
              Adicionar primeiro produto
            </button>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço lista</th>
                <th>Preço venda</th>
                <th>Destaque</th>
                <th>Disponível</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Miniatura do produto */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "var(--cream)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          /* Ícone placeholder quando o produto não tem foto */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        )}
                      </div>
                      {/* Nome e slug do produto */}
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-muted">{p.categorySlug ?? "—"}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {formatCurrency(p.listPriceCents)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {p.salePriceCents ? formatCurrency(p.salePriceCents) : "—"}
                    </span>
                  </td>
                  <td>
                    {p.isFeatured
                      ? <span className="wp-badge wp-badge-amber">Destaque</span>
                      : <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    <DisponibilidadeToggle productId={p.id} isAvailable={p.isAvailable} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => abrirEditar(p)}
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        title="Editar produto"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <BotaoDeletar produtoId={p.id} nomeProduto={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProdutoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        produto={produtoEditando}
        categorias={categorias}
      />

      <ImportarCSVModal
        aberto={importarCSVAberto}
        onFechar={() => setImportarCSVAberto(false)}
        onConcluido={() => { setImportarCSVAberto(false); window.location.reload(); }}
      />
    </>
  );
}
