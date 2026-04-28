"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function getToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}/v1${path}`, {
    method: opts.method ?? "GET",
    headers,
    cache: "no-store",
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
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

type Complement = {
  id: string;
  storeId: string;
  complementGroupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  complementGroupId: string;
  name: string;
  description: string;
  additionalPriceCents: number;
  isAvailable: boolean;
};

const FORM_INICIAL: FormState = {
  complementGroupId: "",
  name: "",
  description: "",
  additionalPriceCents: 0,
  isAvailable: true,
};

type Props = {
  gruposIniciais: ComplementGroup[];
  complementosIniciais: Complement[];
};

export function ComplementosClient({ gruposIniciais, complementosIniciais }: Props) {
  const [complementos, setComplementos] = useState<Complement[]>(complementosIniciais);
  const [grupos] = useState<ComplementGroup[]>(gruposIniciais);
  const [grupoFiltro, setGrupoFiltro] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Complement | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoFiltro, setCarregandoFiltro] = useState(false);

  const complementosFiltrados = grupoFiltro
    ? complementos.filter((c) => c.complementGroupId === grupoFiltro)
    : complementos;

  async function recarregar(groupId?: string) {
    try {
      const path = groupId ? `/partner/complements?groupId=${groupId}` : "/partner/complements";
      const lista = await apiFetch<Complement[]>(path);
      if (groupId) {
        // Mescla: mantém os de outros grupos e substitui os do grupo filtrado
        setComplementos((prev) => [
          ...prev.filter((c) => c.complementGroupId !== groupId),
          ...lista,
        ]);
      } else {
        setComplementos(lista);
      }
    } catch {
      // silencioso
    }
  }

  async function handleFiltroChange(id: string) {
    setGrupoFiltro(id);
    if (id) {
      setCarregandoFiltro(true);
      try {
        const lista = await apiFetch<Complement[]>(`/partner/complements?groupId=${id}`);
        setComplementos((prev) => [
          ...prev.filter((c) => c.complementGroupId !== id),
          ...lista,
        ]);
      } finally {
        setCarregandoFiltro(false);
      }
    }
  }

  function abrirCriar() {
    setEditando(null);
    setForm({ ...FORM_INICIAL, complementGroupId: grupoFiltro || "" });
    setErro(null);
    setModalAberto(true);
  }

  function abrirEditar(complemento: Complement) {
    setEditando(complemento);
    setForm({
      complementGroupId: complemento.complementGroupId,
      name: complemento.name,
      description: complemento.description ?? "",
      additionalPriceCents: complemento.additionalPriceCents,
      isAvailable: complemento.isAvailable,
    });
    setErro(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setErro(null);
  }

  function nomeDoGrupo(groupId: string) {
    return grupos.find((g) => g.id === groupId)?.name ?? groupId;
  }

  async function salvar() {
    setErro(null);

    if (!form.complementGroupId) {
      setErro("Selecione um grupo.");
      return;
    }
    if (!form.name.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }

    setSalvando(true);
    try {
      const body = {
        complementGroupId: form.complementGroupId,
        name: form.name,
        description: form.description || undefined,
        additionalPriceCents: form.additionalPriceCents,
        isAvailable: form.isAvailable,
      };

      if (editando) {
        await apiFetch<Complement>(`/partner/complements/${editando.id}`, { method: "PATCH", body });
      } else {
        await apiFetch<Complement>("/partner/complements", { method: "POST", body });
      }

      await recarregar();
      fecharModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar complemento.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleDisponivel(complemento: Complement) {
    try {
      await apiFetch<Complement>(`/partner/complements/${complemento.id}/availability`, {
        method: "PATCH",
        body: { isAvailable: !complemento.isAvailable },
      });
      await recarregar();
    } catch {
      // silencioso
    }
  }

  async function deletar(complemento: Complement) {
    if (!confirm(`Excluir o complemento "${complemento.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await apiFetch(`/partner/complements/${complemento.id}`, { method: "DELETE" });
      await recarregar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir complemento.";
      alert(msg);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Complementos</h1>
            <p>Gerencie complementos vinculados a grupos de personalizacao.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="wp-badge wp-badge-blue">
              {complementos.length} complemento{complementos.length !== 1 ? "s" : ""}
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
              Novo Complemento
            </button>
          </div>
        </div>
      </div>

      {/* Filtro por grupo */}
      <div className="wp-panel" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <select
          className="wp-input"
          value={grupoFiltro}
          onChange={(e) => handleFiltroChange(e.target.value)}
          style={{ flex: "0 1 280px", minWidth: 200 }}
        >
          <option value="">Todos os grupos</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {carregandoFiltro && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Carregando...</span>
        )}
      </div>

      {/* Conteudo */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        {complementosFiltrados.length === 0 ? (
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p className="wp-empty-title">Nenhum complemento cadastrado</p>
            <p className="wp-empty-desc">
              {grupoFiltro
                ? "Nenhum complemento neste grupo ainda."
                : "Adicione complementos para personalizar produtos."}
            </p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={abrirCriar}
              style={{ marginTop: 12 }}
            >
              Criar primeiro complemento
            </button>
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Grupo</th>
                <th>Preco adicional</th>
                <th>Disponivel</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {complementosFiltrados.map((complemento) => (
                <tr key={complemento.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{complemento.name}</div>
                    {complemento.description && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {complemento.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="wp-badge wp-badge-muted">
                      {nomeDoGrupo(complemento.complementGroupId)}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                    {complemento.additionalPriceCents > 0
                      ? formatCurrency(complemento.additionalPriceCents)
                      : <span style={{ color: "var(--text-muted)" }}>Gratis</span>}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="wp-btn wp-btn-secondary"
                      onClick={() => toggleDisponivel(complemento)}
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      title={complemento.isAvailable ? "Tornar indisponivel" : "Tornar disponivel"}
                    >
                      {complemento.isAvailable ? (
                        <StatusBadge variant="on" label="Disponível" />
                      ) : (
                        <StatusBadge variant="off" label="Indisponível" />
                      )}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => abrirEditar(complemento)}
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        title="Editar complemento"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="wp-btn wp-btn-secondary"
                        onClick={() => deletar(complemento)}
                        style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                        title="Excluir complemento"
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
              {editando ? "Editar Complemento" : "Novo Complemento"}
            </h2>

            {erro && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
                {erro}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Grupo</label>
                <select
                  className="wp-input"
                  value={form.complementGroupId}
                  onChange={(e) => setForm((f) => ({ ...f, complementGroupId: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  <option value="">Selecione um grupo...</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nome</label>
                <input
                  type="text"
                  className="wp-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Ao ponto"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Descricao (opcional)</label>
                <textarea
                  className="wp-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descricao do complemento..."
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Preco adicional (R$)</label>
                <input
                  type="number"
                  className="wp-input"
                  step="0.01"
                  min="0"
                  value={form.additionalPriceCents / 100}
                  onChange={(e) => setForm((f) => ({ ...f, additionalPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="complemento-disponivel"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                />
                <label htmlFor="complemento-disponivel" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Disponivel</label>
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
