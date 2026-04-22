"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";
import type { PromocoesResultado } from "@vendza/types";

/* ─── tipos ─────────────────────────────────────────────────────── */

type Props = {
  dados: PromocoesResultado;
};

/* ─── helpers ───────────────────────────────────────────────────── */

function reaisParaCentavos(valor: string): number {
  const limpo = valor.replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

function centavosParaReais(centavos: number | null): string {
  if (centavos === null || centavos === 0) return "";
  return (centavos / 100).toFixed(2).replace(".", ",");
}

/* ─── modal de editar preço ─────────────────────────────────────── */

type ModalPrecoProps = {
  produto: { id: string; name: string; salePriceCents: number | null } | null;
  onFechar: () => void;
};

function ModalPreco({ produto, onFechar }: ModalPrecoProps) {
  const [preco, setPreco] = useState(() => centavosParaReais(produto?.salePriceCents ?? null));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!produto) return null;

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!produto) return;
    setErro(null);

    const centavos = reaisParaCentavos(preco);
    if (!centavos) {
      setErro("Informe um preço válido.");
      return;
    }

    setSalvando(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
      const res = await fetch(`${API_URL}/v1/partner/products/${produto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ salePriceCents: centavos }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Erro ${res.status}`);
      }
      window.location.reload();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
      setSalvando(false);
    }
  }

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
      <div
        style={{
          background: "var(--surface)", borderRadius: 16,
          width: "100%", maxWidth: 420,
          boxShadow: "0 24px 64px rgba(15,23,42,.18)",
          overflow: "hidden",
        }}
      >
        {/* cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--carbon)" }}>
            Editar preço promocional
          </h2>
          <button
            type="button"
            onClick={onFechar}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* formulário */}
        <form onSubmit={handleSalvar} style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Produto: <strong style={{ color: "var(--carbon)" }}>{produto.name}</strong>
          </p>

          <div className="wp-form-group" style={{ marginBottom: 16 }}>
            <label className="wp-label">Novo preço promocional (R$)</label>
            <input
              className="wp-input"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              autoFocus
              required
            />
          </div>

          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#dc2626", marginBottom: 16,
            }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="wp-btn wp-btn-secondary" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="wp-btn wp-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar preço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── modal de criar promoção rápida ────────────────────────────── */

type ModalCriarProps = {
  produtos: Array<{ id: string; name: string; salePriceCents: number | null }>;
  onFechar: () => void;
};

function ModalCriarPromocao({ produtos, onFechar }: ModalCriarProps) {
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [preco, setPreco] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!produtoId) { setErro("Selecione um produto."); return; }
    const centavos = reaisParaCentavos(preco);
    if (!centavos) { setErro("Informe um preço válido."); return; }

    setSalvando(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
      const res = await fetch(`${API_URL}/v1/partner/products/${produtoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ salePriceCents: centavos }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Erro ${res.status}`);
      }
      window.location.reload();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
      setSalvando(false);
    }
  }

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
      <div
        style={{
          background: "var(--surface)", borderRadius: 16,
          width: "100%", maxWidth: 440,
          boxShadow: "0 24px 64px rgba(15,23,42,.18)",
          overflow: "hidden",
        }}
      >
        {/* cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--carbon)" }}>
            Criar promoção rápida
          </h2>
          <button
            type="button"
            onClick={onFechar}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* formulário */}
        <form onSubmit={handleSalvar} style={{ padding: 24 }}>
          <div className="wp-form-group" style={{ marginBottom: 16 }}>
            <label className="wp-label">Produto</label>
            <select
              className="wp-select"
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
            >
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="wp-form-group" style={{ marginBottom: 16 }}>
            <label className="wp-label">Preço promocional (R$)</label>
            <input
              className="wp-input"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              required
            />
          </div>

          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#dc2626", marginBottom: 16,
            }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="wp-btn wp-btn-secondary" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="wp-btn wp-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Criar promoção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── componente principal ──────────────────────────────────────── */

export function PromocoesClient({ dados }: Props) {
  const { emPromocao, alertasParado, alertasEstoqueAlto } = dados;

  /* estado dos modais */
  const [modalEditando, setModalEditando] = useState<{
    id: string; name: string; salePriceCents: number | null;
  } | null>(null);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  /* todos os produtos para o select do modal de criar */
  const todosProdutos: Array<{ id: string; name: string; salePriceCents: number | null }> = [
    ...emPromocao.map((p) => ({ id: p.id, name: p.name, salePriceCents: p.salePriceCents })),
    ...alertasParado.map((p) => ({ id: p.id, name: p.name, salePriceCents: p.salePriceCents })),
    ...alertasEstoqueAlto.map((p) => ({ id: p.id, name: p.name, salePriceCents: p.salePriceCents })),
  ];

  /* deduplicar por id */
  const produtosUnicos = todosProdutos.filter(
    (p, i, arr) => arr.findIndex((q) => q.id === p.id) === i,
  );

  const temAlgumDado =
    emPromocao.length > 0 || alertasParado.length > 0 || alertasEstoqueAlto.length > 0;

  return (
    <>
      {/* ── cabeçalho da página ───────────────────────────────────── */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Central de Promoções</h1>
            <p>Gerencie preços promocionais e identifique produtos com oportunidade de giro.</p>
          </div>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={() => setModalCriarAberto(true)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Criar promoção rápida
          </button>
        </div>
      </div>

      {/* ── estado vazio global ───────────────────────────────────── */}
      {!temAlgumDado && (
        <div className="wp-panel">
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p className="wp-empty-title">Nenhuma promoção ativa</p>
            <p className="wp-empty-desc">
              Nenhum produto está em promoção e não há alertas de giro ou estoque.
            </p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={() => setModalCriarAberto(true)}
              style={{ marginTop: 12 }}
            >
              Criar primeira promoção
            </button>
          </div>
        </div>
      )}

      {/* ── seção: em promoção ────────────────────────────────────── */}
      {temAlgumDado && (
        <>
          <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
            {/* cabeçalho da seção */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: emPromocao.length > 0 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--carbon)" }}>
                  Em Promoção
                </span>
                <span className="wp-badge wp-badge-green">
                  {emPromocao.length} produto{emPromocao.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {emPromocao.length === 0 ? (
              <div className="wp-empty" style={{ padding: "32px 20px" }}>
                <p className="wp-empty-title" style={{ fontSize: 14 }}>Nenhum produto em promoção</p>
                <p className="wp-empty-desc">Use o botão acima para criar uma promoção rápida.</p>
              </div>
            ) : (
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço Original</th>
                    <th>Preço Promo</th>
                    <th>Desconto</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {emPromocao.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--carbon)" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.slug}</div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "line-through" }}>
                        {formatCurrency(p.listPriceCents)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--green)" }}>
                          {formatCurrency(p.salePriceCents)}
                        </span>
                      </td>
                      <td>
                        <span className="wp-badge wp-badge-green">
                          {p.descontoPercent}% OFF
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {p.currentStock} un.
                      </td>
                      <td>
                        <button
                          type="button"
                          className="wp-btn wp-btn-secondary"
                          onClick={() => setModalEditando({ id: p.id, name: p.name, salePriceCents: p.salePriceCents })}
                          style={{ fontSize: 12, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Editar preço
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── seção: alertas ────────────────────────────────────── */}
          {(alertasParado.length > 0 || alertasEstoqueAlto.length > 0) && (
            <div className="wp-stack-lg">
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--carbon)" }}>
                  Alertas de Oportunidade
                </span>
              </div>

              {/* sub-grupo: giro parado */}
              {alertasParado.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                    Giro Parado (14 dias)
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {alertasParado.map((p) => (
                      <div
                        key={p.id}
                        className="wp-panel"
                        style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--carbon)", lineHeight: 1.3 }}>
                            {p.name}
                          </span>
                          <span
                            className="wp-badge wp-badge-amber"
                            style={{ flexShrink: 0 }}
                          >
                            Parado
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                          <span>Lista: {formatCurrency(p.listPriceCents)}</span>
                          {p.salePriceCents && (
                            <span style={{ color: "var(--green)", fontWeight: 600 }}>
                              Promo: {formatCurrency(p.salePriceCents)}
                            </span>
                          )}
                          <span>Estoque: {p.currentStock} un.</span>
                        </div>

                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                          Considere criar uma promoção para girar este produto.
                        </p>

                        <button
                          type="button"
                          className="wp-btn wp-btn-secondary"
                          onClick={() => setModalEditando({ id: p.id, name: p.name, salePriceCents: p.salePriceCents })}
                          style={{ fontSize: 12, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Criar promoção
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* sub-grupo: estoque alto */}
              {alertasEstoqueAlto.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                    Estoque Alto
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {alertasEstoqueAlto.map((p) => (
                      <div
                        key={p.id}
                        className="wp-panel"
                        style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--carbon)", lineHeight: 1.3 }}>
                            {p.name}
                          </span>
                          <span
                            className="wp-badge"
                            style={{
                              flexShrink: 0,
                              background: "rgba(220,38,38,0.10)",
                              color: "#dc2626",
                            }}
                          >
                            Crítico
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                          <span>Lista: {formatCurrency(p.listPriceCents)}</span>
                          {p.salePriceCents && (
                            <span style={{ color: "var(--green)", fontWeight: 600 }}>
                              Promo: {formatCurrency(p.salePriceCents)}
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                          Estoque alto — {p.currentStock} un.{p.safetyStock ? ` (segurança: ${p.safetyStock})` : ""}. Considere reduzir o preço.
                        </p>

                        <button
                          type="button"
                          className="wp-btn wp-btn-secondary"
                          onClick={() => setModalEditando({ id: p.id, name: p.name, salePriceCents: p.salePriceCents })}
                          style={{ fontSize: 12, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Criar promoção
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── modais ────────────────────────────────────────────────── */}
      {modalEditando && (
        <ModalPreco
          produto={modalEditando}
          onFechar={() => setModalEditando(null)}
        />
      )}

      {modalCriarAberto && produtosUnicos.length > 0 && (
        <ModalCriarPromocao
          produtos={produtosUnicos}
          onFechar={() => setModalCriarAberto(false)}
        />
      )}

      {/* modal de criar sem produtos cadastrados */}
      {modalCriarAberto && produtosUnicos.length === 0 && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(10,10,14,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setModalCriarAberto(false)}
        >
          <div
            style={{
              background: "var(--surface)", borderRadius: 16,
              width: "100%", maxWidth: 360, padding: 32,
              boxShadow: "0 24px 64px rgba(15,23,42,.18)",
              textAlign: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontWeight: 700, color: "var(--carbon)", marginBottom: 8 }}>
              Nenhum produto disponível
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Cadastre produtos no catálogo antes de criar promoções.
            </p>
            <button
              type="button"
              className="wp-btn wp-btn-secondary"
              onClick={() => setModalCriarAberto(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
