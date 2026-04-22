"use client";

import { useEffect, useState } from "react";
import type { Cliente } from "@vendza/types";

import { createClient } from "../../../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready_for_delivery: "Pronto",
  out_for_delivery: "A caminho",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "wp-status wp-status-pending",
  confirmed: "wp-status wp-status-confirmed",
  preparing: "wp-status wp-status-preparing",
  ready_for_delivery: "wp-status wp-status-ready",
  out_for_delivery: "wp-status wp-status-out_delivery",
  delivered: "wp-status wp-status-delivered",
  cancelled: "wp-status wp-status-cancelled",
};

type PedidoResumo = {
  id: string;
  publicId: string;
  status: string;
  totalCents: number;
  placedAt: string;
};

type Tag = {
  id: string;
  label: string;
  createdAt: string;
};

type Nota = {
  id: string;
  body: string;
  createdAt: string;
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

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

type Props = {
  clienteId: string | null;
  onClose: () => void;
};

const TAG_COLORS = [
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#ffedd5", text: "#9a3412" },
];

function tagColor(label: string): { bg: string; text: string } {
  const idx = label.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % TAG_COLORS.length;
  return TAG_COLORS[idx] ?? TAG_COLORS[0] ?? { bg: "#e5e7eb", text: "#374151" };
}

export function ClienteDetalhe({ clienteId, onClose }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toggleIndo, setToggleIndo] = useState(false);

  const [tags, setTags] = useState<Tag[]>([]);
  const [novaTag, setNovaTag] = useState("");
  const [adicionandoTag, setAdicionandoTag] = useState(false);

  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaNotaBody, setNovaNotaBody] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);

  useEffect(() => {
    if (!clienteId) {
      setCliente(null);
      setPedidos([]);
      setTags([]);
      setNotas([]);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setCliente(null);
    setPedidos([]);
    setTags([]);
    setNotas([]);

    (async () => {
      try {
        const [cli, tagsData, notasData] = await Promise.all([
          fetchComAuth<Cliente>(`/partner/customers/${clienteId}`),
          fetchComAuth<Tag[]>(`/partner/customers/${clienteId}/tags`),
          fetchComAuth<Nota[]>(`/partner/customers/${clienteId}/notas`),
        ]);
        if (cancelado) return;
        setCliente(cli);
        setTags(tagsData);
        setNotas(notasData);

        const respPedidos = await fetchComAuth<{ orders: PedidoResumo[] }>(
          `/partner/orders?search=${encodeURIComponent(cli.phone)}`,
        );
        if (!cancelado) {
          setPedidos((respPedidos.orders ?? []).slice(0, 10));
        }
      } catch (err) {
        if (!cancelado) {
          setErro(err instanceof Error ? err.message : "Erro ao carregar cliente.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => { cancelado = true; };
  }, [clienteId]);

  // Fechar com Escape
  useEffect(() => {
    if (!clienteId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [clienteId, onClose]);

  async function handleAdicionarTag() {
    if (!cliente || !novaTag.trim()) return;
    setAdicionandoTag(true);
    try {
      const tag = await fetchComAuth<Tag>(`/partner/customers/${cliente.id}/tags`, {
        method: "POST",
        body: JSON.stringify({ label: novaTag.trim() }),
      });
      setTags((prev) => [...prev, tag]);
      setNovaTag("");
    } catch {
      // ignora erro silenciosamente
    } finally {
      setAdicionandoTag(false);
    }
  }

  async function handleRemoverTag(label: string) {
    if (!cliente) return;
    try {
      await fetchComAuth(`/partner/customers/${cliente.id}/tags/${encodeURIComponent(label)}`, {
        method: "DELETE",
      });
      setTags((prev) => prev.filter((t) => t.label !== label));
    } catch {
      // ignora
    }
  }

  async function handleSalvarNota() {
    if (!cliente || !novaNotaBody.trim()) return;
    setSalvandoNota(true);
    try {
      const nota = await fetchComAuth<Nota>(`/partner/customers/${cliente.id}/notas`, {
        method: "POST",
        body: JSON.stringify({ body: novaNotaBody.trim() }),
      });
      setNotas((prev) => [nota, ...prev]);
      setNovaNotaBody("");
    } catch {
      // ignora
    } finally {
      setSalvandoNota(false);
    }
  }

  async function toggleAtivo() {
    if (!cliente) return;
    setToggleIndo(true);
    try {
      const atualizado = await fetchComAuth<Cliente>(`/partner/customers/${cliente.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isInactive: !cliente.isInactive }),
      });
      setCliente(atualizado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar status do cliente.");
    } finally {
      setToggleIndo(false);
    }
  }

  // Métricas calculadas
  const totalPedidos = pedidos.length;
  const ticketMedio = totalPedidos > 0
    ? Math.round(pedidos.reduce((s, p) => s + p.totalCents, 0) / totalPedidos)
    : 0;

  if (!clienteId) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(10,10,14,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 401,
        width: "min(480px, 100vw)",
        background: "var(--surface)",
        boxShadow: "-8px 0 40px rgba(15,23,42,.18)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--night)" }}>
            {cliente ? cliente.name : "Carregando..."}
          </span>
          <button
            type="button" onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 6, borderRadius: 8,
              display: "flex", alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {carregando && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
              Carregando cliente...
            </div>
          )}

          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626",
            }}>
              {erro}
            </div>
          )}

          {cliente && (
            <div className="wp-stack">
              {/* Avatar + dados básicos */}
              <div className="wp-card">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "var(--g)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 700, flexShrink: 0,
                  }}>
                    {getInitials(cliente.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--night)" }}>{cliente.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{cliente.phone}</div>
                    {cliente.email && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{cliente.email}</div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      {cliente.isInactive
                        ? <span className="wp-badge wp-badge-amber">Inativo</span>
                        : <span className="wp-badge wp-badge-green">Ativo</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`wp-btn ${cliente.isInactive ? "wp-btn-primary" : "wp-btn-secondary"}`}
                    style={{ fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}
                    onClick={toggleAtivo}
                    disabled={toggleIndo}
                  >
                    {toggleIndo
                      ? "Salvando..."
                      : cliente.isInactive ? "Reativar" : "Inativar"}
                  </button>
                </div>
              </div>

              {/* Métricas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  {
                    label: "Total gasto",
                    valor: formatCents(cliente.totalSpentCents),
                  },
                  {
                    label: "Pedidos realizados",
                    valor: String(totalPedidos),
                  },
                  {
                    label: "Ticket médio",
                    valor: totalPedidos > 0 ? formatCents(ticketMedio) : "—",
                  },
                  {
                    label: "Último pedido",
                    valor: cliente.lastOrderAt
                      ? new Date(cliente.lastOrderAt).toLocaleDateString("pt-BR")
                      : "—",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      background: "var(--s8)", borderRadius: 10, padding: "12px 14px",
                      border: "1px solid var(--s6)",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--night)" }}>
                      {m.valor}
                    </div>
                  </div>
                ))}
              </div>

              {/* Últimos pedidos */}
              {pedidos.length > 0 && (
                <div className="wp-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--s6)" }}>
                    <span className="wp-card-title">Últimos pedidos</span>
                  </div>
                  <table className="wp-table" style={{ borderRadius: 0 }}>
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Data</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidos.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700, fontSize: 13 }}>{p.publicId}</td>
                          <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {new Date(p.placedAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>
                            {formatCents(p.totalCents)}
                          </td>
                          <td>
                            <span className={STATUS_CLASS[p.status] ?? "wp-status"} style={{ fontSize: 11 }}>
                              {STATUS_LABEL[p.status] ?? p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {pedidos.length === 0 && !carregando && (
                <div style={{ textAlign: "center", padding: "16px", fontSize: 13, color: "var(--text-muted)" }}>
                  Nenhum pedido encontrado para este cliente.
                </div>
              )}

              {/* Tags */}
              <div className="wp-card">
                <div style={{ marginBottom: 12 }}>
                  <span className="wp-card-title">Tags</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {tags.map((t) => {
                    const cor = tagColor(t.label);
                    return (
                      <span
                        key={t.id}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          background: cor.bg, color: cor.text,
                          borderRadius: 20, padding: "3px 10px 3px 10px",
                          fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {t.label}
                        <button
                          type="button"
                          onClick={() => handleRemoverTag(t.label)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: cor.text, padding: 0, display: "flex",
                            alignItems: "center", opacity: 0.7,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                  {tags.length === 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Nenhuma tag</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdicionarTag(); }}
                    placeholder="Nova tag..."
                    maxLength={50}
                    style={{
                      flex: 1, border: "1px solid var(--s6)", borderRadius: 8,
                      padding: "6px 10px", fontSize: 13, outline: "none",
                      background: "var(--surface)",
                    }}
                  />
                  <button
                    type="button"
                    className="wp-btn wp-btn-primary"
                    style={{ fontSize: 12, padding: "6px 12px" }}
                    onClick={handleAdicionarTag}
                    disabled={adicionandoTag || !novaTag.trim()}
                  >
                    {adicionandoTag ? "..." : "Adicionar"}
                  </button>
                </div>
              </div>

              {/* Notas internas */}
              <div className="wp-card">
                <div style={{ marginBottom: 12 }}>
                  <span className="wp-card-title">Notas internas</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <textarea
                    value={novaNotaBody}
                    onChange={(e) => setNovaNotaBody(e.target.value)}
                    placeholder="Adicionar uma nota interna..."
                    rows={3}
                    style={{
                      width: "100%", border: "1px solid var(--s6)", borderRadius: 8,
                      padding: "8px 10px", fontSize: 13, resize: "vertical",
                      outline: "none", background: "var(--surface)",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      type="button"
                      className="wp-btn wp-btn-primary"
                      style={{ fontSize: 12, padding: "6px 14px" }}
                      onClick={handleSalvarNota}
                      disabled={salvandoNota || !novaNotaBody.trim()}
                    >
                      {salvandoNota ? "Salvando..." : "Salvar nota"}
                    </button>
                  </div>
                </div>
                {notas.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {notas.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          background: "var(--s8)", borderRadius: 8, padding: "10px 12px",
                          border: "1px solid var(--s6)",
                        }}
                      >
                        <div style={{ fontSize: 13, color: "var(--night)", whiteSpace: "pre-wrap" }}>{n.body}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                          {new Date(n.createdAt).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {notas.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Nenhuma nota registrada.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
