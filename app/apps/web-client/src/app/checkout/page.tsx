"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCurrency } from "@vendza/utils";

import { useCarrinho } from "../../context/CarrinhoContext";
import { useEnderecos, usePerfil, type Endereco } from "../../hooks/useEnderecos";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type PaymentMethod = "pix" | "cash" | "card_on_delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, limparCarrinho } = useCarrinho();
  const { enderecos, salvar: salvarEndereco } = useEnderecos();
  const { perfil } = usePerfil();

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
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

  // Pré-preencher com dados do perfil ao montar
  useEffect(() => {
    if (perfil.nome) setNome(perfil.nome);
    if (perfil.telefone) setTelefone(perfil.telefone);
    if (perfil.email) setEmail(perfil.email);
  }, [perfil.nome, perfil.telefone, perfil.email]);

  useEffect(() => {
    if (items.length === 0 && !pedidoCriado) {
      router.replace("/");
    }
  }, [items.length, router, pedidoCriado]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
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

        {erro && (
          <div className="wc-note" style={{ borderLeftColor: "var(--amber)", color: "var(--carbon)" }}>
            {erro}
          </div>
        )}

        <button
          type="submit"
          className="wc-btn wc-btn-primary"
          disabled={enviando}
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
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Subtotal</span>
          <span style={{ color: "var(--green)" }}>{formatCurrency(subtotalCents)}</span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
          Frete calculado no processamento do pedido.
        </p>
      </aside>
    </div>
  );
}
