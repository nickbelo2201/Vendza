"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatCurrency } from "@vendza/utils";

import { ProdutoModal } from "./ProdutoModal";
import { BotaoDeletar } from "./BotaoDeletar";
import { DisponibilidadeToggle } from "./DisponibilidadeToggle";
import { ImportarCSVModal } from "./ImportarCSVModal";
import { buscarProdutos } from "./actions";

type CategoriaFilha = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
};

type Categoria = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  children?: CategoriaFilha[];
};

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
  produtosIniciais: Produto[];
  totalIniciais: number;
  totalPaginasIniciais: number;
  categorias: Categoria[];
};

export function CatalogoClient({ produtosIniciais, totalIniciais, totalPaginasIniciais, categorias }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoParaEditar | null>(null);
  const [importarCSVAberto, setImportarCSVAberto] = useState(false);

  // Filtros e paginacao
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [total, setTotal] = useState(totalIniciais);
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasIniciais);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [carregando, setCarregando] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Categorias pai (sem parentCategoryId)
  const categoriasPai = categorias.filter((c) => !c.parentCategoryId);

  // Subcategorias da categoria selecionada
  const subcategorias = categoriaId
    ? categoriasPai.find((c) => c.id === categoriaId)?.children ?? []
    : [];

  const fetchProdutos = useCallback(async (params: {
    busca?: string;
    categoriaId?: string;
    subcategoriaId?: string;
    pagina?: number;
  }) => {
    setCarregando(true);
    try {
      const resp = await buscarProdutos({
        busca: params.busca || undefined,
        categoriaId: params.categoriaId || undefined,
        subcategoriaId: params.subcategoriaId || undefined,
        pagina: params.pagina ?? 1,
        limite: 20,
      });
      setProdutos(resp.produtos);
      setTotal(resp.total);
      setTotalPaginas(resp.totalPaginas);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Busca com debounce
  function handleBuscaChange(valor: string) {
    setBusca(valor);
    setPagina(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProdutos({ busca: valor, categoriaId, subcategoriaId, pagina: 1 });
    }, 300);
  }

  function handleCategoriaChange(id: string) {
    setCategoriaId(id);
    setSubcategoriaId("");
    setPagina(1);
    fetchProdutos({ busca, categoriaId: id, subcategoriaId: "", pagina: 1 });
  }

  function handleSubcategoriaChange(id: string) {
    setSubcategoriaId(id);
    setPagina(1);
    fetchProdutos({ busca, categoriaId, subcategoriaId: id, pagina: 1 });
  }

  function handlePagina(novaPagina: number) {
    setPagina(novaPagina);
    fetchProdutos({ busca, categoriaId, subcategoriaId, pagina: novaPagina });
  }

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
      {/* Header com botao Novo Produto */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Catalogo</h1>
            <p>Gerencie produtos e disponibilidade para pedidos.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="wp-badge wp-badge-blue">
              {total} produto{total !== 1 ? "s" : ""}
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

      {/* Barra de filtros */}
      <div className="wp-panel" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Busca */}
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="wp-input"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
            style={{ paddingLeft: 34, width: "100%" }}
          />
        </div>

        {/* Categoria pai */}
        <select
          className="wp-input"
          value={categoriaId}
          onChange={(e) => handleCategoriaChange(e.target.value)}
          style={{ flex: "0 1 200px", minWidth: 160 }}
        >
          <option value="">Todas as categorias</option>
          {categoriasPai.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Subcategoria (aparece apos selecionar categoria pai) */}
        {subcategorias.length > 0 && (
          <select
            className="wp-input"
            value={subcategoriaId}
            onChange={(e) => handleSubcategoriaChange(e.target.value)}
            style={{ flex: "0 1 200px", minWidth: 160 }}
          >
            <option value="">Todas subcategorias</option>
            {subcategorias.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Indicador de carregamento */}
        {carregando && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Carregando...</span>
        )}
      </div>

      {/* Tabela */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {produtos.length === 0 && !carregando ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <p className="wp-empty-title">
              {busca || categoriaId ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
            <p className="wp-empty-desc">
              {busca || categoriaId
                ? "Tente ajustar os filtros de busca."
                : "Adicione produtos para comecar a receber pedidos."}
            </p>
            {!busca && !categoriaId && (
              <button type="button" className="wp-btn wp-btn-primary" onClick={abrirCriar} style={{ marginTop: 12 }}>
                Adicionar primeiro produto
              </button>
            )}
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preco lista</th>
                <th>Preco venda</th>
                <th>Destaque</th>
                <th>Disponivel</th>
                <th>Acoes</th>
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
                          /* Icone placeholder quando o produto nao tem foto */
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
                    <span className="wp-badge wp-badge-muted">{p.categorySlug ?? "\u2014"}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {formatCurrency(p.listPriceCents)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {p.salePriceCents ? formatCurrency(p.salePriceCents) : "\u2014"}
                    </span>
                  </td>
                  <td>
                    {p.isFeatured
                      ? <span className="wp-badge wp-badge-amber">Destaque</span>
                      : <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{"\u2014"}</span>}
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

      {/* Paginacao */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            className="wp-btn wp-btn-secondary"
            disabled={pagina <= 1 || carregando}
            onClick={() => handlePagina(pagina - 1)}
            style={{ fontSize: 13, padding: "6px 14px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Pagina {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            className="wp-btn wp-btn-secondary"
            disabled={pagina >= totalPaginas || carregando}
            onClick={() => handlePagina(pagina + 1)}
            style={{ fontSize: 13, padding: "6px 14px" }}
          >
            Proximo
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

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
