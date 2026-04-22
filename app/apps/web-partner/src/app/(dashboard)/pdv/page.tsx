"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "../../../utils/supabase/client";
import type { Categoria, ProdutoResumo } from "@vendza/types";

import { BarcodeScanner } from "../../../components/BarcodeScanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function fetchComAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

// ─── Tipos locais do PDV ───────────────────────────────────────────────────────
type ItemCarrinho = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantidade: number;
};
type TipoEntrega = "balcao" | "delivery";

// ─── Ícones SVG ───────────────────────────────────────────────────────────────

function IconStore() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
      <path d="M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
      <line x1="12" y1="3" x2="12" y2="9"/>
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PdvPage() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("balcao");
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cash" | "card_on_delivery">("pix");
  const [valorRecebido, setValorRecebido] = useState("");

  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [barcodeErro, setBarcodeErro] = useState<string | null>(null);

  // Carrega categorias + produtos ao montar
  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErroCarregar(null);
      try {
        const [cats, prodsResp] = await Promise.all([
          fetchComAuth<Categoria[]>("/partner/categories"),
          fetchComAuth<{ produtos: ProdutoResumo[] }>("/partner/products?limite=500"),
        ]);
        setCategorias(
          (cats as Categoria[])
            .filter((c) => c.isActive)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        );
        setProdutos(prodsResp.produtos);
      } catch (err) {
        setErroCarregar(err instanceof Error ? err.message : "Erro ao carregar dados.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Limpa mensagem de sucesso após 3s
  useEffect(() => {
    if (!sucessoMsg) return;
    const t = setTimeout(() => setSucessoMsg(null), 3000);
    return () => clearTimeout(t);
  }, [sucessoMsg]);

  const adicionarItem = useCallback((produto: ProdutoResumo) => {
    if (!produto.isAvailable) return;
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.productId === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.productId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, {
        productId: produto.id,
        productName: produto.name,
        unitPriceCents: produto.salePriceCents ?? produto.listPriceCents,
        quantidade: 1,
      }];
    });
  }, []);

  const alterarQuantidade = useCallback((productId: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantidade: i.quantidade + delta } : i)
        .filter((i) => i.quantidade > 0)
    );
  }, []);

  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
    setTipoEntrega("balcao");
    setMetodoPagamento("pix");
    setValorRecebido("");
    setRua(""); setNumero(""); setBairro(""); setCidade(""); setEstado("");
    setErro(null);
  }, []);

  const subtotal = carrinho.reduce((s, i) => s + i.unitPriceCents * i.quantidade, 0);

  const trocoInsuficiente = useMemo(() => {
    if (metodoPagamento !== "cash" || valorRecebido === "") return false;
    const cents = Math.round(parseFloat(valorRecebido) * 100);
    return !isNaN(cents) && cents > 0 && cents < subtotal;
  }, [metodoPagamento, valorRecebido, subtotal]);

  const handleBarcodeDetectado = useCallback(async (codigo: string) => {
    setScannerAberto(false);
    setBarcodeErro(null);
    try {
      const produto = await fetchComAuth<ProdutoResumo & { barcode: string | null }>(`/partner/products/barcode/${encodeURIComponent(codigo)}`);
      if (produto) {
        adicionarItem(produto);
        setSucessoMsg(`"${produto.name}" adicionado ao carrinho.`);
      }
    } catch {
      setBarcodeErro(`Produto com código ${codigo} não encontrado. Cadastre-o primeiro.`);
    }
  }, [adicionarItem]);

  // Hierarquia: apenas raízes e subcategorias da raiz selecionada
  const categoriasPai = categorias.filter((c) => !c.parentCategoryId);
  const subcategorias = categoriaId
    ? categoriasPai.find((c) => c.id === categoriaId)?.children ?? []
    : [];

  const produtosFiltrados = useMemo(() => {
    let lista = produtos;
    // Busca por nome
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter((p) => p.name.toLowerCase().includes(termo));
    }
    // Filtro por subcategoria
    if (subcategoriaId) {
      lista = lista.filter((p) => p.categoryId === subcategoriaId);
    } else if (categoriaId) {
      // Inclui a própria categoria pai + todas as filhas
      const idsFilhas = (categoriasPai.find((c) => c.id === categoriaId)?.children ?? []).map((c) => c.id);
      const ids = new Set([categoriaId, ...idsFilhas]);
      lista = lista.filter((p) => p.categoryId !== null && ids.has(p.categoryId));
    }
    return lista;
  }, [produtos, busca, categoriaId, subcategoriaId, categoriasPai]);

  async function handleFinalizar() {
    setErro(null);
    if (carrinho.length === 0) {
      setErro("Adicione ao menos um produto ao carrinho.");
      return;
    }
    if (tipoEntrega === "delivery" && (!rua.trim() || !bairro.trim() || !cidade.trim() || !estado.trim())) {
      setErro("Preencha rua, bairro, cidade e estado para delivery.");
      return;
    }

    setEnviando(true);
    try {
      await fetchComAuth("/partner/orders/manual", {
        method: "POST",
        body: JSON.stringify({
          customer: { name: "Consumidor" },
          items: carrinho.map((i) => ({ productId: i.productId, quantity: i.quantidade })),
          deliveryType: tipoEntrega,
          ...(tipoEntrega === "delivery"
            ? {
                address: {
                  line1: rua.trim(),
                  ...(numero.trim() ? { number: numero.trim() } : {}),
                  neighborhood: bairro.trim(),
                  city: cidade.trim(),
                  state: estado.trim(),
                },
              }
            : {}),
          payment: { method: metodoPagamento },
        }),
      });

      setSucessoMsg("Pedido criado com sucesso!");
      limparCarrinho();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar pedido.");
    } finally {
      setEnviando(false);
    }
  }

  const toggleStyle = (ativo: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", transition: "all 0.15s",
    background: ativo ? "var(--g)" : "var(--s8)",
    color: ativo ? "#fff" : "var(--night)",
    border: ativo ? "1.5px solid var(--g)" : "1.5px solid var(--s6)",
  });

  // ─── Loading / Erro de carregamento ─────────────────────────────────────────

  if (carregando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--text-muted)", fontSize: 14 }}>
        Carregando produtos...
      </div>
    );
  }

  if (erroCarregar) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
        <div style={{ color: "#dc2626", fontSize: 14 }}>{erroCarregar}</div>
        <button type="button" className="wp-btn wp-btn-secondary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  // ─── Layout principal ────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", gap: 16, height: "calc(100vh - 120px)", minHeight: 0 }}>

      {/* ── Coluna esquerda: grade de produtos (60%) ─── */}
      <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>

        {/* Barra de filtros: scanner + pesquisa + categorias + subcategorias */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", flexShrink: 0, flexWrap: "wrap" }}>
          {/* Botão scanner */}
          <button
            type="button"
            className="wp-btn wp-btn-secondary"
            onClick={() => { setBarcodeErro(null); setScannerAberto(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/>
              <path d="M21 15v4a2 2 0 0 1-2 2h-4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/>
              <line x1="7" y1="12" x2="7" y2="12"/><line x1="12" y1="12" x2="17" y2="12"/>
            </svg>
            Escanear
          </button>

          {/* Campo de pesquisa */}
          <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="wp-input"
              placeholder="Pesquisar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ paddingLeft: 30, fontSize: 13, width: "100%" }}
            />
          </div>

          {/* Select de categoria pai */}
          <select
            className="wp-input"
            value={categoriaId}
            onChange={(e) => { setCategoriaId(e.target.value); setSubcategoriaId(""); }}
            style={{ flex: "0 1 160px", minWidth: 130, fontSize: 13 }}
          >
            <option value="">Categorias</option>
            {categoriasPai.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Select de subcategoria — só aparece quando há filhas */}
          {subcategorias.length > 0 && (
            <select
              className="wp-input"
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              style={{ flex: "0 1 160px", minWidth: 130, fontSize: 13 }}
            >
              <option value="">Subcategorias</option>
              {subcategorias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Erro de barcode */}
          {barcodeErro && (
            <span style={{ fontSize: 12, color: "#dc2626", flexBasis: "100%" }}>{barcodeErro}</span>
          )}
        </div>

        {/* Grade de produtos */}
        <div style={{
          flex: 1, overflowY: "auto", paddingTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10, alignContent: "start",
        }}>
          {produtosFiltrados.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1", textAlign: "center", padding: "40px 0",
              fontSize: 13, color: "var(--text-muted)",
            }}>
              Nenhum produto nesta categoria.
            </div>
          ) : (
            produtosFiltrados.map((produto) => {
              const preco = produto.salePriceCents ?? produto.listPriceCents;
              const indisponivel = !produto.isAvailable;
              return (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => adicionarItem(produto)}
                  disabled={indisponivel}
                  style={{
                    background: "var(--surface)",
                    border: "1.5px solid var(--s6)",
                    borderRadius: 12,
                    padding: 0,
                    cursor: indisponivel ? "not-allowed" : "pointer",
                    opacity: indisponivel ? 0.45 : 1,
                    textAlign: "left",
                    transition: "all 0.12s",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Imagem do produto */}
                  <div style={{
                    width: "100%", aspectRatio: "1 / 1",
                    background: "var(--s8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {produto.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={produto.imageUrl}
                        alt={produto.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--s5)" strokeWidth="1.5">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--night)", lineHeight: 1.3, marginBottom: 4 }}>
                      {produto.name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--g)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {formatCents(preco)}
                    </div>
                    {indisponivel && (
                      <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>Indisponível</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Coluna direita: carrinho (40%) ─── */}
      <div style={{
        flex: "0 0 40%", display: "flex", flexDirection: "column",
        background: "var(--surface)", border: "1px solid var(--s6)",
        borderRadius: 14, overflow: "hidden", minHeight: 0,
      }}>
        {/* Cabeçalho do carrinho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--night)" }}>
            Carrinho
            {carrinho.length > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 600,
                background: "var(--g)", color: "#fff",
                borderRadius: 10, padding: "2px 7px",
              }}>
                {carrinho.reduce((s, i) => s + i.quantidade, 0)} itens
              </span>
            )}
          </div>
          {carrinho.length > 0 && (
            <button
              type="button"
              onClick={limparCarrinho}
              title="Limpar carrinho"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
            >
              <IconTrash />
            </button>
          )}
        </div>

        {/* Lista de itens — scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
          {carrinho.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "var(--text-muted)" }}>
              Toque em um produto para adicionar
            </div>
          ) : (
            <div className="wp-stack" style={{ gap: 6 }}>
              {carrinho.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--s8)", borderRadius: 8, padding: "8px 10px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--night)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {formatCents(item.unitPriceCents)} × {item.quantidade}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.productId, -1)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: "1px solid var(--s6)",
                        background: "var(--surface)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: "var(--night)",
                      }}
                    >−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 22, textAlign: "center" }}>
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.productId, 1)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: "1px solid var(--s6)",
                        background: "var(--surface)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: "var(--night)",
                      }}
                    >+</button>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--g)", fontFamily: "'Space Grotesk', sans-serif", minWidth: 56, textAlign: "right" }}>
                    {formatCents(item.unitPriceCents * item.quantidade)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé: total + controles + finalizar */}
        <div style={{ flexShrink: 0, borderTop: "1px solid var(--s6)", padding: "12px 14px" }} className="wp-stack">

          {/* Total */}
          {carrinho.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--s8)", borderRadius: 8, padding: "8px 12px",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--night)" }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--g)", fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCents(subtotal)}
              </span>
            </div>
          )}

          {/* Tipo de venda */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Tipo de venda
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={toggleStyle(tipoEntrega === "balcao")} onClick={() => setTipoEntrega("balcao")}>
                <IconStore /> Balcão
              </button>
              <button type="button" style={toggleStyle(tipoEntrega === "delivery")} onClick={() => setTipoEntrega("delivery")}>
                <IconTruck /> Delivery
              </button>
            </div>
          </div>

          {/* Endereço para delivery */}
          {tipoEntrega === "delivery" && (
            <div className="wp-stack" style={{ gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <div className="wp-form-group">
                  <label className="wp-label">Rua *</label>
                  <input className="wp-input" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" style={{ fontSize: 12 }} />
                </div>
                <div className="wp-form-group" style={{ minWidth: 64 }}>
                  <label className="wp-label">Nº</label>
                  <input className="wp-input" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="S/N" style={{ fontSize: 12 }} />
                </div>
              </div>
              <div className="wp-form-group">
                <label className="wp-label">Bairro *</label>
                <input className="wp-input" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" style={{ fontSize: 12 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <div className="wp-form-group">
                  <label className="wp-label">Cidade *</label>
                  <input className="wp-input" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" style={{ fontSize: 12 }} />
                </div>
                <div className="wp-form-group" style={{ minWidth: 54 }}>
                  <label className="wp-label">UF *</label>
                  <input className="wp-input" value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} style={{ fontSize: 12 }} />
                </div>
              </div>
            </div>
          )}

          {/* Forma de pagamento */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Pagamento
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["pix", "cash", "card_on_delivery"] as const).map((m) => {
                const labels: Record<string, string> = { pix: "PIX", cash: "Dinheiro", card_on_delivery: "Cartão" };
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMetodoPagamento(m); setValorRecebido(""); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.15s",
                      background: metodoPagamento === m ? "var(--g)" : "var(--s8)",
                      color: metodoPagamento === m ? "#fff" : "var(--night)",
                      border: metodoPagamento === m ? "1px solid var(--g)" : "1px solid var(--s6)",
                    }}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Troco — apenas quando Dinheiro */}
          {metodoPagamento === "cash" && (
            <div style={{ background: "var(--s8)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Cálculo de troco
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {[5, 10, 20, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValorRecebido(String(v))}
                    style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                      cursor: "pointer", background: "var(--surface)", border: "1px solid var(--s6)",
                      color: "var(--night)",
                    }}
                  >
                    R${v}
                  </button>
                ))}
              </div>
              <input
                className="wp-input"
                type="number"
                min="0"
                step="0.01"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="Valor recebido (R$)"
                inputMode="decimal"
                style={{ fontSize: 12, marginBottom: 6 }}
              />
              {valorRecebido !== "" && (() => {
                const recebidoCents = Math.round(parseFloat(valorRecebido) * 100);
                if (isNaN(recebidoCents)) return null;
                const troco = recebidoCents - subtotal;
                return (
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: troco >= 0 ? "#16a34a" : "#dc2626",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {troco >= 0
                      ? `Troco: ${formatCents(troco)}`
                      : `Valor insuficiente — faltam ${formatCents(subtotal - recebidoCents)}`}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Mensagem de erro */}
          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626",
            }}>
              {erro}
            </div>
          )}

          {/* Mensagem de sucesso */}
          {sucessoMsg && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#16a34a", fontWeight: 600,
            }}>
              {sucessoMsg}
            </div>
          )}

          {/* Botão finalizar */}
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={handleFinalizar}
            disabled={enviando || carrinho.length === 0 || trocoInsuficiente}
            title={trocoInsuficiente ? "Valor recebido insuficiente" : undefined}
            style={{ width: "100%", justifyContent: "center", fontSize: 14, padding: "12px 0" }}
          >
            {enviando ? "Criando pedido..." : carrinho.length === 0 ? "Carrinho vazio" : `Finalizar pedido · ${formatCents(subtotal)}`}
          </button>
        </div>
      </div>

      {/* Scanner de código de barras */}
      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleBarcodeDetectado}
          onFechar={() => setScannerAberto(false)}
        />
      )}
    </div>
  );
}
