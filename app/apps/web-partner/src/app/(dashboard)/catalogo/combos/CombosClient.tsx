"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "@vendza/utils";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function apiFetch<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    cache: "no-store",
    ...(opts.body !== undefined ? {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts.body),
    } : {}),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const msg = (json?.error?.message ?? json?.message ?? `Erro ${res.status}`) as string;
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data as T;
}

type ComboItem = {
  id: string;
  comboId: string;
  productId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  productListPriceCents: number;
};

type Combo = {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: ComboItem[];
};

type ProdutoSimples = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
};

type ItemForm = {
  productId: string;
  quantity: number;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  isActive: boolean;
  items: ItemForm[];
};

function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const FORM_INICIAL: FormState = {
  name: "",
  slug: "",
  description: "",
  priceCents: 0,
  isActive: true,
  items: [],
};

type Props = {
  combosIniciais: Combo[];
};

export function CombosClient({ combosIniciais }: Props) {
  const [combos, setCombos] = useState<Combo[]>(combosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Combo | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<ProdutoSimples[]>([]);
  const produtosBuscadosRef = useRef(false);

  async function recarregar() {
    try {
      const lista = await apiFetch<Combo[]>("/partner/combos");
      setCombos(lista);
    } catch {
      // silencioso
    }
  }

  async function buscarProdutos() {
    if (produtosBuscadosRef.current) return;
    produtosBuscadosRef.current = true;
    try {
      const resp = await apiFetch<{ produtos: ProdutoSimples[] }>("/partner/products?limite=500");
      setProdutos(resp.produtos ?? []);
    } catch {
      // silencioso
    }
  }

  function abrirCriar() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErro(null);
    setModalAberto(true);
    buscarProdutos();
  }

  function abrirEditar(combo: Combo) {
    setEditando(combo);
    setForm({
      name: combo.name,
      slug: combo.slug,
      description: combo.description ?? "",
      priceCents: combo.priceCents,
      isActive: combo.isActive,
      items: combo.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    setErro(null);
    setModalAberto(true);
    buscarProdutos();
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

  function adicionarItem() {
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: "", quantity: 1 }],
    }));
  }

  function removerItem(idx: number) {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx),
    }));
  }

  function atualizarItem(idx: number, campo: keyof ItemForm, valor: string | number) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) =>
        i === idx ? { ...item, [campo]: valor } : item
      ),
    }));
  }

  async function salvar() {
    setErro(null);

    if (!form.name.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }
    if (!form.slug.trim()) {
      setErro("Slug e obrigatorio.");
      return;
    }
    if (form.items.length === 0) {
      setErro("Adicione pelo menos 1 produto ao combo.");
      return;
    }
    const itensSemProduto = form.items.some((i) => !i.productId);
    if (itensSemProduto) {
      setErro("Selecione o produto para todos os itens.");
      return;
    }

    setSalvando(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        priceCents: form.priceCents,
        isActive: form.isActive,
        items: form.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      if (editando) {
        await apiFetch<Combo>(`/partner/combos/${editando.id}`, { method: "PATCH", body });
      } else {
        await apiFetch<Combo>("/partner/combos", { method: "POST", body });
      }

      await recarregar();
      fecharModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar combo.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleAtivo(combo: Combo) {
    try {
      await apiFetch<Combo>(`/partner/combos/${combo.id}/active`, {
        method: "PATCH",
        body: { isActive: !combo.isActive },
      });
      await recarregar();
    } catch {
      // silencioso
    }
  }

  async function deletar(combo: Combo) {
    if (!confirm(`Excluir o combo "${combo.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await apiFetch<{ deleted: true }>(`/partner/combos/${combo.id}`, { method: "DELETE" });
      await recarregar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir combo.";
      alert(msg);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Combos</h1>
            <p>Crie e administre conjuntos de produtos com preco especial.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="wp-badge wp-badge-blue">
              {combos.length} combo{combos.length !== 1 ? "s" : ""}
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
              Novo Combo
            </button>
          </div>
        </div>
      </div>

      {/* Conteudo */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {combos.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <p className="wp-empty-title">Nenhum combo cadastrado</p>
            <p className="wp-empty-desc">Crie combos para oferecer conjuntos de produtos com preco especial.</p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={abrirCriar}
              style={{ marginTop: 12 }}
            >
              Criar primeiro combo
            </button>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome / Slug</th>
                <th>Preco</th>
                <th>Itens</th>
                <th>Ativo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => (
                <tr key={combo.id}>
                  <td>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "var(--cream)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {combo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={combo.imageUrl}
                          alt={combo.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{combo.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {combo.slug}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatCurrency(combo.priceCents)}
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-muted">
                      {combo.items.length} produto{combo.items.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="wp-btn wp-btn-secondary"
                      onClick={() => toggleAtivo(combo)}
                      style={{ fontSize: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}
                      title={combo.isActive ? "Desativar combo" : "Ativar combo"}
                    >
                      {combo.isActive ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span className="wp-badge wp-badge-green" style={{ fontSize: 11 }}>Ativo</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                          <span className="wp-badge wp-badge-muted" style={{ fontSize: 11 }}>Inativo</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => abrirEditar(combo)}
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        title="Editar combo"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => deletar(combo)}
                        style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                        title="Excluir combo"
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="wp-panel" style={{ width: "100%", maxWidth: 560, padding: 24, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>{editando ? "Editar Combo" : "Novo Combo"}</h2>

            {erro && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
                {erro}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nome</label>
                <input
                  type="text"
                  className="wp-input"
                  value={form.name}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Ex: Combo Economico"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Slug</label>
                <input
                  type="text"
                  className="wp-input"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="combo-economico"
                  style={{ width: "100%", fontFamily: "'Space Grotesk', sans-serif" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Descricao (opcional)</label>
                <textarea
                  className="wp-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descricao do combo..."
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Preco do combo (R$)</label>
                <input
                  type="number"
                  className="wp-input"
                  step="0.01"
                  min="0"
                  value={form.priceCents / 100}
                  onChange={(e) => setForm((f) => ({ ...f, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="combo-ativo"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <label htmlFor="combo-ativo" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ativo</label>
              </div>

              {/* Itens do combo */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Produtos do combo</label>
                  <button
                    type="button"
                    className="wp-btn wp-btn-secondary"
                    onClick={adicionarItem}
                    style={{ fontSize: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Adicionar produto
                  </button>
                </div>

                {form.items.length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
                    Nenhum produto adicionado. Clique em "Adicionar produto".
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        className="wp-input"
                        value={item.productId}
                        onChange={(e) => atualizarItem(idx, "productId", e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="">Selecione um produto...</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {formatCurrency(p.listPriceCents)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="wp-input"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => atualizarItem(idx, "quantity", Math.max(1, parseInt(e.target.value || "1", 10)))}
                        style={{ width: 70 }}
                        title="Quantidade"
                      />
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => removerItem(idx)}
                        style={{ padding: "4px 8px", color: "var(--red, #dc2626)", flexShrink: 0 }}
                        title="Remover item"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" className="wp-btn wp-btn-secondary" onClick={fecharModal}>
                Cancelar
              </button>
              <button type="button" className="wp-btn wp-btn-primary" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
