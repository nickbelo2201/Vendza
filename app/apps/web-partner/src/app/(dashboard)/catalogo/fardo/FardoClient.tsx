"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { fetchAPI } from "../../../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type ProductBundle = {
  id: string;
  productId: string;
  productName?: string;
  name: string;
  slug: string;
  bundlePriceCents: number;
  itemsJson: { quantity: number };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProdutoSimples = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
};

type FormState = {
  productId: string;
  name: string;
  slug: string;
  bundlePriceCents: number;
  quantity: number;
  isAvailable: boolean;
};

const FORM_INICIAL: FormState = {
  productId: "",
  name: "",
  slug: "",
  bundlePriceCents: 0,
  quantity: 1,
  isAvailable: true,
};

function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatarPreco(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = {
  fardosIniciais: ProductBundle[];
  produtosIniciais: ProdutoSimples[];
};

export function FardoClient({ fardosIniciais, produtosIniciais }: Props) {
  const [fardos, setFardos] = useState<ProductBundle[]>(fardosIniciais);
  const [produtos, setProdutos] = useState<ProdutoSimples[]>(produtosIniciais);
  const [filtroProduto, setFiltroProduto] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ProductBundle | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const produtosBuscadosRef = useRef(false);

  const fardosFiltrados = useMemo(() => {
    if (!filtroProduto) return fardos;
    return fardos.filter((f) => f.productId === filtroProduto);
  }, [fardos, filtroProduto]);

  function nomeProduto(productId: string): string {
    return produtos.find((p) => p.id === productId)?.name ?? productId;
  }

  function precoProduto(productId: string): number {
    return produtos.find((p) => p.id === productId)?.listPriceCents ?? 0;
  }

  async function carregarProdutos() {
    if (produtosBuscadosRef.current) return;
    produtosBuscadosRef.current = true;
    try {
      const resp = await fetchAPI<{ produtos: ProdutoSimples[] }>("/partner/products?limite=1000");
      setProdutos(resp.produtos ?? []);
    } catch {
      // silencioso
    }
  }

  async function recarregar() {
    try {
      const url = filtroProduto
        ? `/partner/product-bundles?productId=${filtroProduto}`
        : "/partner/product-bundles";
      const lista = await fetchAPI<ProductBundle[]>(url);
      setFardos(lista);
    } catch {
      // silencioso
    }
  }

  async function recarregarTodos() {
    try {
      const lista = await fetchAPI<ProductBundle[]>("/partner/product-bundles");
      setFardos(lista);
    } catch {
      // silencioso
    }
  }

  function abrirCriar() {
    setEditando(null);
    setForm({
      ...FORM_INICIAL,
      productId: filtroProduto || (produtos[0]?.id ?? ""),
    });
    setErro(null);
    setModalAberto(true);
    carregarProdutos();
  }

  function abrirEditar(fardo: ProductBundle) {
    setEditando(fardo);
    setForm({
      productId: fardo.productId,
      name: fardo.name,
      slug: fardo.slug,
      bundlePriceCents: fardo.bundlePriceCents,
      quantity: fardo.itemsJson.quantity,
      isAvailable: fardo.isAvailable,
    });
    setErro(null);
    setModalAberto(true);
    carregarProdutos();
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setErro(null);
  }

  function handleNomeChange(valor: string) {
    setForm((f) => ({
      ...f,
      name: valor,
      slug: editando ? f.slug : gerarSlug(valor),
    }));
  }

  function handleProdutoChange(productId: string) {
    const prod = produtos.find((p) => p.id === productId);
    setForm((f) => ({
      ...f,
      productId,
      bundlePriceCents: prod ? prod.listPriceCents * f.quantity : f.bundlePriceCents,
    }));
  }

  function handleQuantidadeChange(qty: number) {
    const prod = produtos.find((p) => p.id === form.productId);
    setForm((f) => ({
      ...f,
      quantity: qty,
      bundlePriceCents: prod ? prod.listPriceCents * qty : f.bundlePriceCents,
    }));
  }

  async function salvar() {
    setErro(null);

    if (!form.productId) {
      setErro("Selecione um produto.");
      return;
    }
    if (!form.name.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }
    if (!form.slug.trim()) {
      setErro("Slug e obrigatorio.");
      return;
    }
    if (form.quantity < 1) {
      setErro("Quantidade deve ser pelo menos 1.");
      return;
    }

    setSalvando(true);
    try {
      const body = {
        productId: form.productId,
        name: form.name,
        slug: form.slug,
        bundlePriceCents: form.bundlePriceCents,
        itemsJson: { quantity: form.quantity },
        isAvailable: form.isAvailable,
      };

      if (editando) {
        await fetchAPI<ProductBundle>(`/partner/product-bundles/${editando.id}`, { method: "PATCH", body });
      } else {
        await fetchAPI<ProductBundle>("/partner/product-bundles", { method: "POST", body });
      }

      await recarregarTodos();
      fecharModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar fardo.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function deletar(fardo: ProductBundle) {
    if (!confirm(`Excluir o fardo "${fardo.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await fetchAPI(`/partner/product-bundles/${fardo.id}`, { method: "DELETE" });
      await recarregarTodos();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir fardo.";
      alert(msg);
    }
  }

  // Desconto calculado: preco unitario x qtd - preco do fardo
  function calcularDesconto(fardo: ProductBundle): { valorUnitario: number; totalSemDesconto: number; desconto: number; percentual: number } {
    const valorUnitario = precoProduto(fardo.productId);
    const totalSemDesconto = valorUnitario * fardo.itemsJson.quantity;
    const desconto = totalSemDesconto - fardo.bundlePriceCents;
    const percentual = totalSemDesconto > 0 ? Math.round((desconto / totalSemDesconto) * 100) : 0;
    return { valorUnitario, totalSemDesconto, desconto, percentual };
  }

  // Para formulario
  const produtoSelecionado = produtos.find((p) => p.id === form.productId);
  const totalSemDescontoForm = produtoSelecionado ? produtoSelecionado.listPriceCents * form.quantity : 0;
  const descontoForm = totalSemDescontoForm - form.bundlePriceCents;
  const percentualForm = totalSemDescontoForm > 0 ? Math.round((descontoForm / totalSemDescontoForm) * 100) : 0;

  return (
    <>
      <div className="wp-stack-lg">
        <div className="wp-page-header">
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <Link href="/catalogo" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                Catalogo
              </Link>
              {" > Fardos e Pacotes"}
            </span>
          </div>
          <div className="wp-row-between">
            <div>
              <h1>Fardos e Pacotes</h1>
              <p>Crie ofertas de quantidade com preco especial por fardo ou pacote.</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="wp-badge wp-badge-blue">
                {fardos.length} fardo{fardos.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={abrirCriar}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Novo Fardo
              </button>
            </div>
          </div>
        </div>

        {produtos.length > 0 && (
          <div className="wp-panel" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <select
              className="wp-input"
              value={filtroProduto}
              onChange={(e) => setFiltroProduto(e.target.value)}
              style={{ flex: "0 1 280px", minWidth: 180 }}
            >
              <option value="">Todos os produtos</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
          {fardos.length === 0 ? (
            <div className="wp-empty">
              <div className="wp-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <p className="wp-empty-title">Nenhum fardo cadastrado</p>
              <p className="wp-empty-desc">Crie fardos para oferecer descontos por quantidade na compra de produtos.</p>
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={abrirCriar}
                style={{ marginTop: 12 }}
              >
                Criar primeiro fardo
              </button>
            </div>
          ) : fardosFiltrados.length === 0 ? (
            <div className="wp-empty">
              <div className="wp-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="wp-empty-title">Nenhum fardo para este produto</p>
              <p className="wp-empty-desc">Selecione outro produto ou crie um novo fardo.</p>
            </div>
          ) : (
            <table className="wp-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Nome do fardo</th>
                  <th>Qtd</th>
                  <th>Preco do fardo</th>
                  <th>Preco unit. calculado</th>
                  <th>Desconto</th>
                  <th>Disponivel</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {fardosFiltrados.map((fardo) => {
                  const { valorUnitario, desconto, percentual } = calcularDesconto(fardo);
                  const precoUnitCalculado = fardo.itemsJson.quantity > 0
                    ? fardo.bundlePriceCents / fardo.itemsJson.quantity
                    : 0;
                  return (
                    <tr key={fardo.id}>
                      <td>
                        <span className="wp-badge wp-badge-muted">
                          {fardo.productName ?? nomeProduto(fardo.productId)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{fardo.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {fardo.slug}
                        </div>
                      </td>
                      <td style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                        {fardo.itemsJson.quantity} un.
                      </td>
                      <td style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                        {formatarPreco(fardo.bundlePriceCents)}
                      </td>
                      <td style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        <div style={{ color: "var(--green)", fontWeight: 600 }}>
                          {formatarPreco(Math.round(precoUnitCalculado))}
                        </div>
                        {valorUnitario > 0 && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                            lista: {formatarPreco(valorUnitario)}
                          </div>
                        )}
                      </td>
                      <td>
                        {desconto > 0 ? (
                          <span className="wp-badge wp-badge-amber">-{percentual}%</span>
                        ) : (
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {fardo.isAvailable ? (
                          <span className="wp-badge wp-badge-blue">Disponivel</span>
                        ) : (
                          <span className="wp-badge wp-badge-muted">Indisponivel</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="wp-btn wp-btn-secondary"
                            onClick={() => abrirEditar(fardo)}
                            style={{ fontSize: 12, padding: "4px 10px" }}
                            title="Editar fardo"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="wp-btn wp-btn-secondary"
                            onClick={() => deletar(fardo)}
                            style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                            title="Excluir fardo"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                {editando ? "Editar Fardo" : "Novo Fardo"}
              </h2>
              <button
                type="button"
                onClick={fecharModal}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                  Produto
                </label>
                <select
                  className="wp-input"
                  value={form.productId}
                  onChange={(e) => handleProdutoChange(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatarPreco(p.listPriceCents)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                  Nome do fardo
                </label>
                <input
                  type="text"
                  className="wp-input"
                  placeholder="Ex: Fardo 12 un."
                  value={form.name}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  style={{ width: "100%" }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                  Slug
                </label>
                <input
                  type="text"
                  className="wp-input"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  style={{ width: "100%", fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Preenchido automaticamente a partir do nome.
                </span>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                    Quantidade no fardo
                  </label>
                  <input
                    type="number"
                    className="wp-input"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => handleQuantidadeChange(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                    Preco do fardo (R$)
                  </label>
                  <input
                    type="number"
                    className="wp-input"
                    step="0.01"
                    min="0"
                    value={form.bundlePriceCents / 100}
                    onChange={(e) => setForm((f) => ({ ...f, bundlePriceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {produtoSelecionado && form.quantity > 0 && (
                <div style={{
                  background: "var(--cream)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 13,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--carbon)" }}>
                    Resumo do desconto
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Preco unitario (lista):</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatarPreco(produtoSelecionado.listPriceCents)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Total sem desconto ({form.quantity} un.):</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatarPreco(totalSemDescontoForm)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Preco do fardo:</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{formatarPreco(form.bundlePriceCents)}</span>
                    </div>
                    {descontoForm > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 6, marginTop: 2 }}>
                        <span style={{ color: "var(--green)", fontWeight: 600 }}>Economia do cliente:</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--green)" }}>
                          {formatarPreco(descontoForm)} ({percentualForm}% off)
                        </span>
                      </div>
                    )}
                    {descontoForm <= 0 && totalSemDescontoForm > 0 && (
                      <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
                        O preco do fardo deve ser menor que o total sem desconto para gerar economia.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  id="fardo-disponivel"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="fardo-disponivel" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--carbon)" }}>
                  Disponivel para pedidos
                </label>
              </div>

              {erro && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                }}>
                  {erro}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  className="wp-btn wp-btn-secondary"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={salvar}
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : editando ? "Salvar alteracoes" : "Criar fardo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
