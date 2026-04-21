"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

import { createClient } from "../../../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type Produto = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
};

type ItemPedido = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantidade: number;
};

type Secao = "cliente" | "itens" | "entrega";
type TipoEntrega = "balcao" | "delivery";

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

// ─── Ícones SVG ───────────────────────────────────────────────────────────────

function IconStore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
      <path d="M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
      <line x1="12" y1="3" x2="12" y2="9"/>
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

export function PedidoManualModal({ aberto, onFechar }: Props) {
  const router = useRouter();
  const [secao, setSecao] = useState<Secao>("cliente");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Seção 1 — Cliente
  const [identificarCliente, setIdentificarCliente] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Seção 2 — Itens
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);

  // Seção 3 — Entrega e pagamento
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("balcao");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cash" | "card_on_delivery">("pix");
  const [valorRecebido, setValorRecebido] = useState("");

  // Reset ao abrir
  useEffect(() => {
    if (!aberto) return;
    setSecao("cliente");
    setErro(null);
    setIdentificarCliente(false);
    setTelefone(""); setNome(""); setEmail("");
    setItensPedido([]); setBuscaProduto("");
    setTipoEntrega("balcao");
    setRua(""); setNumero(""); setBairro(""); setCidade(""); setEstado("");
    setMetodoPagamento("pix");
    setValorRecebido("");

    fetchComAuth<{ produtos: Produto[] }>("/partner/products")
      .then((res) => setProdutos(Array.isArray(res) ? res : (res.produtos ?? [])))
      .catch(() => setProdutos([]));
  }, [aberto]);

  // Fechar com Escape
  useEffect(() => {
    if (!aberto) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [aberto, onFechar]);

  // Buscar cliente por telefone
  const buscarCliente = useCallback(async (tel: string) => {
    if (tel.replace(/\D/g, "").length < 8) return;
    setBuscandoCliente(true);
    try {
      type ClienteItem = { id: string; name: string; phone: string; email: string | null };
      type ClienteResp = ClienteItem[] | { items: ClienteItem[] };
      const resp = await fetchComAuth<ClienteResp>(`/partner/customers?search=${encodeURIComponent(tel)}`);
      const lista = !Array.isArray(resp) && "items" in resp ? resp.items : resp as ClienteItem[];
      const primeiro = lista[0];
      if (primeiro) {
        setNome(primeiro.name);
        setEmail(primeiro.email ?? "");
      }
    } catch {
      // sem resultado — deixar campos em branco
    } finally {
      setBuscandoCliente(false);
    }
  }, []);

  function adicionarItem(produto: Produto) {
    setItensPedido((prev) => {
      const existente = prev.find((i) => i.productId === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.productId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [...prev, {
        productId: produto.id,
        productName: produto.name,
        unitPriceCents: produto.salePriceCents ?? produto.listPriceCents,
        quantidade: 1,
      }];
    });
  }

  function alterarQuantidade(productId: string, delta: number) {
    setItensPedido((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantidade: i.quantidade + delta } : i)
        .filter((i) => i.quantidade > 0),
    );
  }

  const subtotal = itensPedido.reduce((s, i) => s + i.unitPriceCents * i.quantidade, 0);

  const trocoInsuficiente = useMemo(() => {
    if (metodoPagamento !== "cash" || valorRecebido === "") return false;
    const cents = Math.round(parseFloat(valorRecebido) * 100);
    return !isNaN(cents) && cents > 0 && cents < subtotal;
  }, [metodoPagamento, valorRecebido, subtotal]);

  const produtosFiltrados = buscaProduto.trim()
    ? produtos.filter((p) => p.name.toLowerCase().includes(buscaProduto.toLowerCase()))
    : produtos;

  async function handleSubmit() {
    setErro(null);

    // Validação de cliente (só quando identificado)
    if (identificarCliente && (!nome.trim() || !telefone.trim())) {
      setErro("Nome e telefone do cliente são obrigatórios.");
      setSecao("cliente");
      return;
    }
    if (itensPedido.length === 0) {
      setErro("Adicione ao menos um item ao pedido.");
      setSecao("itens");
      return;
    }
    // Validação de endereço (só para delivery)
    if (tipoEntrega === "delivery" && (!rua.trim() || !bairro.trim() || !cidade.trim() || !estado.trim())) {
      setErro("Endereço incompleto (rua, bairro, cidade e estado são obrigatórios).");
      setSecao("entrega");
      return;
    }

    setEnviando(true);
    try {
      await fetchComAuth("/partner/orders/manual", {
        method: "POST",
        body: JSON.stringify({
          customer: identificarCliente
            ? {
                name: nome.trim(),
                phone: telefone.trim(),
                ...(email.trim() ? { email: email.trim() } : {}),
              }
            : { name: "Consumidor" },
          items: itensPedido.map((i) => ({ productId: i.productId, quantity: i.quantidade })),
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

      router.refresh();
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar pedido.");
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) return null;

  const SECOES: { id: Secao; label: string }[] = [
    { id: "cliente", label: "1. Cliente" },
    { id: "itens", label: "2. Itens" },
    { id: "entrega", label: "3. Entrega e pagamento" },
  ];

  const toggleStyle = (ativo: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 7,
    padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", transition: "all 0.15s",
    background: ativo ? "var(--g)" : "var(--s8)",
    color: ativo ? "#fff" : "var(--night)",
    border: ativo ? "1.5px solid var(--g)" : "1.5px solid var(--s6)",
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,10,14,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div style={{
        background: "var(--surface)", borderRadius: 16,
        width: "100%", maxWidth: 560,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(15,23,42,.2)",
        overflow: "hidden",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--night)" }}>Novo pedido manual</h2>
          <button
            type="button" onClick={onFechar}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs de seção */}
        <div style={{
          display: "flex", gap: 0, borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          {SECOES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSecao(s.id)}
              style={{
                flex: 1, padding: "10px 8px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: secao === s.id ? 700 : 500,
                color: secao === s.id ? "var(--g)" : "var(--text-muted)",
                borderBottom: secao === s.id ? "2px solid var(--g)" : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Corpo com scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* ── Seção 1 — Cliente ── */}
          {secao === "cliente" && (
            <div className="wp-stack">
              {/* Toggle identificar cliente */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--s8)", borderRadius: 10, padding: "12px 14px",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--night)" }}>Identificar cliente</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {identificarCliente ? "Preencha os dados do cliente" : "Venda anônima — pedido como Consumidor"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIdentificarCliente((v) => !v)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: identificarCliente ? "var(--g)" : "var(--s5)",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                  aria-checked={identificarCliente}
                  role="switch"
                >
                  <span style={{
                    position: "absolute", top: 3, left: identificarCliente ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {/* Campos de cliente — visíveis apenas quando identificando */}
              {identificarCliente && (
                <>
                  <div className="wp-form-group">
                    <label className="wp-label">Telefone *</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="wp-input"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        onBlur={() => buscarCliente(telefone)}
                        placeholder="(11) 99999-9999"
                        inputMode="tel"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        style={{ fontSize: 13, whiteSpace: "nowrap" }}
                        disabled={buscandoCliente}
                        onClick={() => buscarCliente(telefone)}
                      >
                        {buscandoCliente ? "Buscando..." : "Buscar"}
                      </button>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Se o cliente já existe, seus dados serão preenchidos automaticamente.
                    </span>
                  </div>

                  <div className="wp-form-group">
                    <label className="wp-label">Nome *</label>
                    <input
                      className="wp-input"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="wp-form-group">
                    <label className="wp-label">Email (opcional)</label>
                    <input
                      className="wp-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      type="email"
                      inputMode="email"
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={() => setSecao("itens")}
                >
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Seção 2 — Itens ── */}
          {secao === "itens" && (
            <div className="wp-stack">
              {/* Busca de produto */}
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", pointerEvents: "none",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <input
                  className="wp-input"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  placeholder="Buscar produto..."
                  style={{ paddingLeft: 36 }}
                />
              </div>

              {/* Lista de produtos */}
              <div style={{
                border: "1px solid var(--s6)", borderRadius: 10,
                maxHeight: 220, overflowY: "auto",
              }}>
                {produtosFiltrados.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  produtosFiltrados.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--s7)",
                        opacity: p.isAvailable ? 1 : 0.5,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
                          {formatCents(p.salePriceCents ?? p.listPriceCents)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        style={{ fontSize: 12, padding: "4px 12px" }}
                        onClick={() => adicionarItem(p)}
                        disabled={!p.isAvailable}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Adicionar
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Itens adicionados */}
              {itensPedido.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Itens selecionados
                  </div>
                  <div className="wp-stack" style={{ gap: 6 }}>
                    {itensPedido.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "var(--s8)", borderRadius: 8, padding: "8px 12px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{item.productName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {formatCents(item.unitPriceCents)} × {item.quantidade} = {formatCents(item.unitPriceCents * item.quantidade)}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.productId, -1)}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              border: "1px solid var(--s6)",
                              background: "var(--surface)", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 16, color: "var(--night)",
                            }}
                          >
                            −
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
                            {item.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.productId, 1)}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              border: "1px solid var(--s6)",
                              background: "var(--surface)", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 16, color: "var(--night)",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      borderTop: "1px solid var(--s6)", paddingTop: 8,
                      fontSize: 14, fontWeight: 700,
                    }}>
                      <span>Subtotal</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--g)" }}>
                        {formatCents(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button type="button" className="wp-btn wp-btn-secondary" onClick={() => setSecao("cliente")}>
                  Voltar
                </button>
                <button type="button" className="wp-btn wp-btn-primary" onClick={() => setSecao("entrega")}>
                  Próximo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── Seção 3 — Entrega e pagamento ── */}
          {secao === "entrega" && (
            <div className="wp-stack">
              {/* Toggle Balcão / Delivery */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Tipo de venda
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" style={toggleStyle(tipoEntrega === "balcao")} onClick={() => setTipoEntrega("balcao")}>
                    <IconStore />
                    Balcão
                  </button>
                  <button type="button" style={toggleStyle(tipoEntrega === "delivery")} onClick={() => setTipoEntrega("delivery")}>
                    <IconTruck />
                    Delivery
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  {tipoEntrega === "balcao"
                    ? "Venda presencial — cliente retira no balcão"
                    : "Pedido com entrega — preencha o endereço abaixo"}
                </div>
              </div>

              {/* Formulário de endereço — apenas Delivery */}
              {tipoEntrega === "delivery" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                    <div className="wp-form-group">
                      <label className="wp-label">Rua *</label>
                      <input
                        className="wp-input"
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div className="wp-form-group" style={{ minWidth: 80 }}>
                      <label className="wp-label">Número</label>
                      <input
                        className="wp-input"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="S/N"
                      />
                    </div>
                  </div>

                  <div className="wp-form-group">
                    <label className="wp-label">Bairro *</label>
                    <input
                      className="wp-input"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                    <div className="wp-form-group">
                      <label className="wp-label">Cidade *</label>
                      <input
                        className="wp-input"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="wp-form-group" style={{ minWidth: 70 }}>
                      <label className="wp-label">Estado *</label>
                      <input
                        className="wp-input"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Forma de pagamento */}
              <div className="wp-form-group">
                <label className="wp-label">Forma de pagamento *</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["pix", "cash", "card_on_delivery"] as const).map((m) => {
                    const labels: Record<string, string> = {
                      pix: "PIX", cash: "Dinheiro", card_on_delivery: "Cartão na entrega",
                    };
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodoPagamento(m)}
                        style={{
                          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
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

              {/* Cálculo de troco — visível apenas quando Dinheiro */}
              {metodoPagamento === "cash" && (
                <div style={{ background: "var(--s8)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Cálculo de troco
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {[5, 10, 20, 50, 100].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setValorRecebido(String(v))}
                        style={{
                          padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                          cursor: "pointer", background: "var(--surface)", border: "1px solid var(--s6)",
                          color: "var(--night)",
                        }}
                      >
                        R${v}
                      </button>
                    ))}
                  </div>
                  <div className="wp-form-group" style={{ marginBottom: 8 }}>
                    <label className="wp-label">Valor recebido pelo cliente (R$)</label>
                    <input
                      className="wp-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                  {valorRecebido !== "" && (() => {
                    const recebidoCents = Math.round(parseFloat(valorRecebido) * 100);
                    if (isNaN(recebidoCents)) return null;
                    const troco = recebidoCents - subtotal;
                    return (
                      <div style={{
                        fontSize: 15, fontWeight: 700,
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

              {/* Resumo do pedido */}
              {itensPedido.length > 0 && (
                <div style={{
                  background: "var(--s8)", borderRadius: 10, padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Resumo
                  </div>
                  {itensPedido.map((item) => (
                    <div key={item.productId} style={{ fontSize: 12, color: "var(--s3)", marginBottom: 4 }}>
                      {item.quantidade}× {item.productName}
                    </div>
                  ))}
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--g)", marginTop: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Subtotal: {formatCents(subtotal)}
                  </div>
                </div>
              )}

              {erro && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626",
                }}>
                  {erro}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                <button type="button" className="wp-btn wp-btn-secondary" onClick={() => setSecao("itens")} disabled={enviando}>
                  Voltar
                </button>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={handleSubmit}
                  disabled={enviando || trocoInsuficiente}
                  title={trocoInsuficiente ? "Valor recebido insuficiente" : undefined}
                >
                  {enviando ? "Criando pedido..." : "Criar pedido"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
