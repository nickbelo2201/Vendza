"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@vendza/utils";

import { useCarrinho } from "../../context/CarrinhoContext";
import { useEnderecos, usePerfil, type Endereco } from "../../hooks/useEnderecos";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type PaymentMethod = "pix" | "cash" | "card_on_delivery";

type FreteInfo = {
  zonaId: string;
  label: string;
  feeCents: number;
  etaMinutes: number;
  fora?: boolean;
  motivo?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, limparCarrinho, carregando: carrinhoCarregando } = useCarrinho();
  const { enderecos, salvar: salvarEndereco } = useEnderecos();
  const { perfil } = usePerfil();

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroFrete, setErroFrete] = useState<string | null>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [pedidoCriado, setPedidoCriado] = useState(false);

  // Campos do form — identificação
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Campos do form — endereço
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  // Endereços salvos
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<string>("");
  const [salvarEsteEndereco, setSalvarEsteEndereco] = useState(false);

  const [pagamento, setPagamento] = useState<PaymentMethod>("pix");

  // Estado de frete
  const [freteInfo, setFreteInfo] = useState<FreteInfo | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pré-preencher com dados do perfil ao montar
  useEffect(() => {
    if (perfil.nome) setNome(perfil.nome);
    if (perfil.telefone) setTelefone(perfil.telefone);
    if (perfil.email) setEmail(perfil.email);
  }, [perfil.nome, perfil.telefone, perfil.email]);

  useEffect(() => {
    if (carrinhoCarregando) return; // aguardar hidratação do localStorage
    if (items.length === 0 && !pedidoCriado) {
      router.replace("/");
    }
  }, [carrinhoCarregando, items.length, router, pedidoCriado]);

  // Debounce: recalcular frete quando bairro ou cep mudar
  useEffect(() => {
    if (!bairro && !cep) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calcularFrete();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bairro, cep]);

  async function calcularFrete() {
    if (!cep && !bairro) return;
    setCalculandoFrete(true);
    setErroFrete(null);
    try {
      const res = await fetch(`${API_URL}/v1/storefront/calcular-frete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cep.replace(/\D/g, ""), bairro }),
      });
      const json = await res.json();
      setFreteInfo(json.data);
    } catch {
      setFreteInfo(null);
      setErroFrete("Não foi possível calcular o frete. Verifique o endereço e tente novamente.");
    } finally {
      setCalculandoFrete(false);
    }
  }

  function usarLocalizacao() {
    if (!navigator.geolocation) return;
    setErroFrete(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setCalculandoFrete(true);
      try {
        const res = await fetch(`${API_URL}/v1/storefront/calcular-frete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        const json = await res.json();
        setFreteInfo(json.data);
      } catch {
        setFreteInfo(null);
        setErroFrete("Não foi possível calcular o frete. Verifique o endereço e tente novamente.");
      } finally {
        setCalculandoFrete(false);
      }
    });
  }

  function aplicarEndereco(end: Endereco) {
    setRua(end.logradouro);
    setNumero(end.numero);
    setComplemento(end.complemento ?? "");
    setBairro(end.bairro);
    setCep(end.cep);
  }

  function handleSelecionarEndereco(id: string) {
    setEnderecoSelecionado(id);
    if (id) {
      const end = enderecos.find((e) => e.id === id);
      if (end) aplicarEndereco(end);
    }
  }

  const freteCents = freteInfo && !freteInfo.fora ? freteInfo.feeCents : 0;
  const totalCents = subtotalCents + freteCents;
  const foraDeArea = freteInfo?.fora === true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErroValidacao(null);

    if (nome.trim().length < 2) {
      setErroValidacao("Informe seu nome completo (mínimo 2 caracteres).");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 10) {
      setErroValidacao("Informe um telefone válido com DDD (mínimo 10 dígitos).");
      return;
    }
    if (!rua.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      setErroValidacao("Preencha todos os campos obrigatórios do endereço de entrega.");
      return;
    }

    setEnviando(true);

    try {
      const body = {
        customer: { name: nome, phone: telefone, email: email || undefined },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address: {
          line1: rua,
          number: numero || undefined,
          complement: complemento || undefined,
          neighborhood: bairro,
          city: cidade,
          state: estado,
          postalCode: cep || undefined,
        },
        payment: { method: pagamento },
        deliveryZoneId: freteInfo?.zonaId,
        freightCents: freteCents,
      };

      const res = await fetch(`${API_URL}/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setErro(json.error?.message ?? "Erro ao criar pedido. Tente novamente.");
        return;
      }

      // Salvar endereço no localStorage se checkbox marcado
      if (salvarEsteEndereco && rua && bairro) {
        salvarEndereco({
          label: "Outro",
          logradouro: rua,
          numero,
          complemento: complemento || undefined,
          bairro,
          cep,
        });
      }

      setPedidoCriado(true);
      limparCarrinho();
      router.push(`/pedidos/${json.data.publicId}`);
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (carrinhoCarregando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "var(--text-muted)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span style={{ fontSize: 15 }}>Carregando carrinho...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return <p style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>Redirecionando...</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 24,
        alignItems: "start",
      }}
    >
      <form onSubmit={handleSubmit} className="wc-card wc-stack">
        <h2 style={{ margin: 0, color: "var(--carbon)" }}>Dados do pedido</h2>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, color: "var(--carbon)", marginBottom: 12 }}>Identificação</legend>
          <div className="wc-stack">
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
                Nome completo *
              </label>
              <input
                className="wc-input"
                required
                minLength={2}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
                Telefone (com DDD) *
              </label>
              <input
                className="wc-input"
                required
                minLength={8}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
                E-mail (opcional)
              </label>
              <input
                className="wc-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>
        </fieldset>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, color: "var(--carbon)", marginBottom: 12 }}>Endereço de entrega</legend>
          <div className="wc-stack">
            {/* Seletor de endereços salvos */}
            {enderecos.length > 0 && (
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
                  Usar endereço salvo
                </label>
                <select
                  className="wc-input"
                  value={enderecoSelecionado}
                  onChange={(e) => handleSelecionarEndereco(e.target.value)}
                >
                  <option value="">— Preencher manualmente —</option>
                  {enderecos.map((end) => (
                    <option key={end.id} value={end.id}>
                      {end.label} — {end.logradouro}, {end.numero}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>Rua *</label>
                <input className="wc-input" required value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>Número</label>
                <input className="wc-input" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>Complemento</label>
              <input className="wc-input" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>Bairro *</label>
              <input className="wc-input" required value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Seu bairro" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 140px", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>Cidade *</label>
                <input className="wc-input" required value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>Estado *</label>
                <input className="wc-input" required maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="SP" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>CEP</label>
                <input className="wc-input" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" maxLength={9} />
              </div>
            </div>

            {/* Botão de geolocalização */}
            <div>
              <button
                type="button"
                onClick={usarLocalizacao}
                className="wc-btn-outline"
                style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <path d="M12 2A10 10 0 0 1 22 12" />
                </svg>
                Usar minha localização
              </button>
            </div>

            {/* Indicador de cálculo de frete */}
            {calculandoFrete && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Calculando frete...
              </div>
            )}

            {/* Erro no cálculo de frete */}
            {!calculandoFrete && erroFrete && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erroFrete}
              </div>
            )}

            {/* Aviso fora de área */}
            {foraDeArea && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {freteInfo?.motivo ?? "Endereço fora da área de entrega"}
              </div>
            )}

            {/* Checkbox salvar endereço — só mostra se não está usando salvo */}
            {!enderecoSelecionado && enderecos.length < 3 && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                <input
                  type="checkbox"
                  checked={salvarEsteEndereco}
                  onChange={(e) => setSalvarEsteEndereco(e.target.checked)}
                />
                Salvar este endereço para próximas compras
              </label>
            )}
          </div>
        </fieldset>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, color: "var(--carbon)", marginBottom: 12 }}>Forma de pagamento</legend>
          <div className="wc-stack">
            {(["pix", "cash", "card_on_delivery"] as PaymentMethod[]).map((method) => (
              <label
                key={method}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${pagamento === method ? "var(--green)" : "var(--border)"}`,
                  background: pagamento === method ? "var(--color-payment-selected-bg)" : "var(--surface)",
                }}
              >
                <input
                  type="radio"
                  name="pagamento"
                  value={method}
                  checked={pagamento === method}
                  onChange={() => setPagamento(method)}
                />
                {method === "pix" ? "PIX" : method === "cash" ? "Dinheiro" : "Cartão na entrega"}
              </label>
            ))}
          </div>
        </fieldset>

        {erroValidacao && (
          <div className="wc-note" style={{ borderLeftColor: "#dc2626", color: "#dc2626" }}>
            {erroValidacao}
          </div>
        )}

        {erro && (
          <div className="wc-note" style={{ borderLeftColor: "var(--amber)", color: "var(--carbon)" }}>
            {erro}
          </div>
        )}

        <button
          type="submit"
          className="wc-btn wc-btn-primary"
          disabled={enviando || foraDeArea}
          style={{ width: "100%" }}
        >
          {enviando ? "Enviando..." : "Finalizar pedido"}
        </button>
      </form>

      <aside className="wc-card wc-stack">
        <h3 style={{ margin: 0, color: "var(--carbon)" }}>Resumo do pedido</h3>
        {items.map((item) => (
          <div
            key={item.id}
            style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}
          >
            <span style={{ color: "var(--carbon)" }}>
              {item.name} × {item.quantity}
            </span>
            <span style={{ fontWeight: 600, color: "var(--green)" }}>
              {formatCurrency(item.unitPriceCents * item.quantity)}
            </span>
          </div>
        ))}
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span style={{ color: "var(--carbon)" }}>{formatCurrency(subtotalCents)}</span>
        </div>

        {/* Linha de frete */}
        {calculandoFrete && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
            <span>Entrega</span>
            <span>Calculando...</span>
          </div>
        )}
        {!calculandoFrete && freteInfo && !freteInfo.fora && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)" }}>
              Entrega
              {freteInfo.etaMinutes > 0 && (
                <span style={{ fontSize: 12, marginLeft: 6, color: "var(--text-muted)" }}>
                  (~{freteInfo.etaMinutes} min)
                </span>
              )}
            </span>
            <span style={{ fontWeight: 600, color: freteInfo.feeCents === 0 ? "var(--green)" : "var(--carbon)" }}>
              {freteInfo.feeCents === 0 ? "Grátis" : formatCurrency(freteInfo.feeCents)}
            </span>
          </div>
        )}
        {!calculandoFrete && freteInfo && freteInfo.fora && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#dc2626" }}>
            <span>Entrega</span>
            <span>Fora da área</span>
          </div>
        )}
        {!calculandoFrete && !freteInfo && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            Informe o bairro ou CEP para calcular o frete.
          </p>
        )}

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "var(--green)" }}>{formatCurrency(totalCents)}</span>
        </div>
      </aside>
    </div>
  );
}
