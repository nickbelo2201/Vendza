"use client";

import { useState } from "react";
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

type ComplementGroup = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  isActive: boolean;
  complementsCount: number;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  description: string;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  isActive: boolean;
};

const FORM_INICIAL: FormState = {
  name: "",
  description: "",
  minSelection: 0,
  maxSelection: 1,
  isRequired: false,
  isActive: true,
};

type Props = {
  gruposIniciais: ComplementGroup[];
};

export function GruposComplementosClient({ gruposIniciais }: Props) {
  const [grupos, setGrupos] = useState<ComplementGroup[]>(gruposIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ComplementGroup | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar() {
    try {
      const lista = await apiFetch<ComplementGroup[]>("/partner/complement-groups");
      setGrupos(lista);
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

  function abrirEditar(grupo: ComplementGroup) {
    setEditando(grupo);
    setForm({
      name: grupo.name,
      description: grupo.description ?? "",
      minSelection: grupo.minSelection,
      maxSelection: grupo.maxSelection,
      isRequired: grupo.isRequired,
      isActive: grupo.isActive,
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
    if (form.maxSelection < form.minSelection) {
      setErro("Selecao maxima deve ser maior ou igual a minima.");
      return;
    }

    setSalvando(true);
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        minSelection: form.minSelection,
        maxSelection: form.maxSelection,
        isRequired: form.isRequired,
        isActive: form.isActive,
      };

      if (editando) {
        await apiFetch<ComplementGroup>(`/partner/complement-groups/${editando.id}`, { method: "PATCH", body });
      } else {
        await apiFetch<ComplementGroup>("/partner/complement-groups", { method: "POST", body });
      }

      await recarregar();
      fecharModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar grupo.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function deletar(grupo: ComplementGroup) {
    if (!confirm(`Excluir o grupo "${grupo.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await apiFetch(`/partner/complement-groups/${grupo.id}`, { method: "DELETE" });
      await recarregar();
    } catch (e: unknown) {
      let msg = "Erro ao excluir grupo.";
      if (e instanceof Error) {
        try {
          const parsed = JSON.parse(e.message);
          msg = parsed?.message ?? e.message;
        } catch {
          msg = e.message;
        }
      }
      alert(msg);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Grupos de Complementos</h1>
            <p>Organize complementos em grupos para personalizar pedidos.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="wp-badge wp-badge-blue">
              {grupos.length} grupo{grupos.length !== 1 ? "s" : ""}
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
              Novo Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Conteudo */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {grupos.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <p className="wp-empty-title">Nenhum grupo cadastrado</p>
            <p className="wp-empty-desc">Crie grupos para organizar complementos por categoria de personalizacao.</p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={abrirCriar}
              style={{ marginTop: 12 }}
            >
              Criar primeiro grupo
            </button>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descricao</th>
                <th>Selecao</th>
                <th>Obrigatorio</th>
                <th>Complementos</th>
                <th>Ativo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.id}>
                  <td style={{ fontWeight: 600 }}>{grupo.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {grupo.description ?? <span style={{ color: "var(--text-muted)" }}>&mdash;</span>}
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-muted" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {grupo.minSelection}&ndash;{grupo.maxSelection}
                    </span>
                  </td>
                  <td>
                    {grupo.isRequired ? (
                      <span className="wp-badge wp-badge-amber">Sim</span>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>&mdash;</span>
                    )}
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-blue">
                      {grupo.complementsCount}
                    </span>
                  </td>
                  <td>
                    {grupo.isActive ? (
                      <span className="wp-badge wp-badge-green">Ativo</span>
                    ) : (
                      <span className="wp-badge wp-badge-muted">Inativo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => abrirEditar(grupo)}
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        title="Editar grupo"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => deletar(grupo)}
                        style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                        title="Excluir grupo"
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
              {editando ? "Editar Grupo de Complementos" : "Novo Grupo de Complementos"}
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
                  placeholder="Ex: Ponto da carne"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Descricao (opcional)</label>
                <textarea
                  className="wp-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descricao do grupo..."
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Selecao minima</label>
                  <input
                    type="number"
                    className="wp-input"
                    min={0}
                    value={form.minSelection}
                    onChange={(e) => setForm((f) => ({ ...f, minSelection: Math.max(0, parseInt(e.target.value || "0", 10)) }))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Selecao maxima</label>
                  <input
                    type="number"
                    className="wp-input"
                    min={1}
                    value={form.maxSelection}
                    onChange={(e) => setForm((f) => ({ ...f, maxSelection: Math.max(1, parseInt(e.target.value || "1", 10)) }))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    id="grupo-obrigatorio"
                    checked={form.isRequired}
                    onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
                  />
                  <label htmlFor="grupo-obrigatorio" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Obrigatorio</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    id="grupo-ativo"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <label htmlFor="grupo-ativo" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ativo</label>
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
