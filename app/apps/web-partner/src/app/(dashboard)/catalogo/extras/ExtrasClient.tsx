"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@vendza/utils";
import { fetchAPI } from "../../../../lib/api";

type Extra = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  description: string;
  priceCents: number;
  isAvailable: boolean;
};

const FORM_INICIAL: FormState = {
  name: "",
  description: "",
  priceCents: 0,
  isAvailable: true,
};

type Props = {
  extrasIniciais: Extra[];
};

export function ExtrasClient({ extrasIniciais }: Props) {
  const [extras, setExtras] = useState<Extra[]>(extrasIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Extra | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try {
      const lista = await fetchAPI<Extra[]>("/partner/extras");
      setExtras(lista);
    } catch {
      // silencioso
    }
  }

  function abrirCriar() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErro(null);
    setModalAberto(true);
  }

  function abrirEditar(extra: Extra) {
    setEditando(extra);
    setForm({
      name: extra.name,
      description: extra.description ?? "",
      priceCents: extra.priceCents,
      isAvailable: extra.isAvailable,
    });
    setErro(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setErro(null);
  }

  async function salvar() {
    setErro(null);

    if (!form.name.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }

    setSalvando(true);
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        priceCents: form.priceCents,
        isAvailable: form.isAvailable,
      };

      if (editando) {
        await fetchAPI<Extra>(`/partner/extras/${editando.id}`, { method: "PATCH", body });
      } else {
        await fetchAPI<Extra>("/partner/extras", { method: "POST", body });
      }

      await recarregar();
      fecharModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar extra.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleDisponivel(extra: Extra) {
    try {
      await fetchAPI<Extra>(`/partner/extras/${extra.id}/availability`, {
        method: "PATCH",
        body: { isAvailable: !extra.isAvailable },
      });
      await recarregar();
    } catch {
      // silencioso
    }
  }

  async function deletar(extra: Extra) {
    if (!confirm(`Excluir o extra "${extra.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await fetchAPI(`/partner/extras/${extra.id}`, { method: "DELETE" });
      await recarregar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir extra.";
      alert(msg);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              <Link href="/catalogo" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                Produtos
              </Link>
              {" > "}
              Extras
            </div>
            <h1>Extras</h1>
            <p>Gerencie itens avulsos que podem ser adicionados a qualquer pedido.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="wp-badge wp-badge-blue">
              {extras.length} extra{extras.length !== 1 ? "s" : ""}
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
              Novo Extra
            </button>
          </div>
        </div>
      </div>

      {/* Conteudo */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {extras.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <p className="wp-empty-title">Nenhum extra cadastrado</p>
            <p className="wp-empty-desc">Adicione extras para permitir que clientes personalizem seus pedidos.</p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={abrirCriar}
              style={{ marginTop: 12 }}
            >
              Criar primeiro extra
            </button>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descricao</th>
                <th>Preco</th>
                <th>Disponivel</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((extra) => (
                <tr key={extra.id}>
                  <td style={{ fontWeight: 600 }}>{extra.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {extra.description ?? <span>&mdash;</span>}
                  </td>
                  <td style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                    {extra.priceCents > 0
                      ? formatCurrency(extra.priceCents)
                      : <span style={{ color: "var(--text-muted)" }}>Gratis</span>}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="wp-btn wp-btn-secondary"
                      onClick={() => toggleDisponivel(extra)}
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      title={extra.isAvailable ? "Tornar indisponivel" : "Tornar disponivel"}
                    >
                      {extra.isAvailable ? (
                        <span className="wp-badge wp-badge-green" style={{ fontSize: 11 }}>Disponivel</span>
                      ) : (
                        <span className="wp-badge wp-badge-muted" style={{ fontSize: 11 }}>Indisponivel</span>
                      )}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => abrirEditar(extra)}
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        title="Editar extra"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => deletar(extra)}
                        style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                        title="Excluir extra"
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
          <div className="wp-panel" style={{ width: "100%", maxWidth: 520, padding: 24, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>
              {editando ? "Editar Extra" : "Novo Extra"}
            </h2>

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
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Molho extra"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Descricao (opcional)</label>
                <textarea
                  className="wp-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descricao do extra..."
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Preco (R$)</label>
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
                  id="extra-disponivel"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                />
                <label htmlFor="extra-disponivel" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Disponivel</label>
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
