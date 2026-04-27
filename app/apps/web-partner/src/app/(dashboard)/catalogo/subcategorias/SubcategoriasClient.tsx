"use client";

import { useState, useMemo } from "react";
import type { Categoria, CategoriaFilha } from "@vendza/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type FormState = {
  name: string;
  slug: string;
  isActive: boolean;
  parentCategoryId: string;
};

type SubcategoriaComPai = CategoriaFilha & {
  isActive?: boolean;
  parentCategoryName: string;
};

type Props = {
  categorias: Categoria[];
};

export function SubcategoriasClient({ categorias: categoriasIniciais }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<SubcategoriaComPai | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    isActive: true,
    parentCategoryId: "",
  });

  const categoriasPai = useMemo(
    () => categorias.filter((c) => !c.parentCategoryId),
    [categorias]
  );

  const subcategorias: SubcategoriaComPai[] = useMemo(() => {
    const resultado: SubcategoriaComPai[] = [];
    for (const pai of categoriasPai) {
      if (pai.children) {
        for (const filho of pai.children) {
          resultado.push({
            ...filho,
            parentCategoryName: pai.name,
          });
        }
      }
    }
    return resultado;
  }, [categoriasPai]);

  const subcategoriasFiltradas = useMemo(() => {
    if (!filtroCategoria) return subcategorias;
    return subcategorias.filter((s) => s.parentCategoryId === filtroCategoria);
  }, [subcategorias, filtroCategoria]);

  async function recarregar() {
    try {
      const res = await fetch(`${API_URL}/v1/partner/categories`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setCategorias(json.data ?? []);
      }
    } catch {}
  }

  function abrirCriar() {
    setEditando(null);
    setForm({
      name: "",
      slug: "",
      isActive: true,
      parentCategoryId: filtroCategoria || (categoriasPai[0]?.id ?? ""),
    });
    setErro(null);
    setModalAberto(true);
  }

  function abrirEditar(s: SubcategoriaComPai) {
    setEditando(s);
    setForm({
      name: s.name,
      slug: s.slug,
      isActive: s.isActive ?? true,
      parentCategoryId: s.parentCategoryId ?? "",
    });
    setErro(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setErro(null);
  }

  function handleNomeChange(valor: string) {
    setForm((prev) => ({
      ...prev,
      name: valor,
      slug: editando ? prev.slug : gerarSlug(valor),
    }));
  }

  async function handleSalvar() {
    if (!form.name.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    if (!form.slug.trim()) {
      setErro("Slug é obrigatório.");
      return;
    }
    if (!editando && !form.parentCategoryId) {
      setErro("Selecione uma categoria pai.");
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const url = editando
        ? `${API_URL}/v1/partner/categories/${editando.id}`
        : `${API_URL}/v1/partner/categories`;

      const body = editando
        ? { name: form.name, slug: form.slug, isActive: form.isActive }
        : { name: form.name, slug: form.slug, isActive: form.isActive, parentCategoryId: form.parentCategoryId };

      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let mensagem = `Erro ${res.status}`;
        try {
          const json = JSON.parse(text);
          mensagem = json.message ?? json.error ?? mensagem;
        } catch {}
        setErro(mensagem);
        return;
      }

      fecharModal();
      await recarregar();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir(s: SubcategoriaComPai) {
    const confirmado = window.confirm(
      `Excluir a subcategoria "${s.name}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    try {
      const res = await fetch(`${API_URL}/v1/partner/categories/${s.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let mensagem = `Erro ${res.status}`;
        try {
          const json = JSON.parse(text);
          mensagem = json.message ?? json.error ?? mensagem;
        } catch {}
        window.alert(mensagem);
        return;
      }

      await recarregar();
    } catch {
      window.alert("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <>
      <div className="wp-stack-lg">
        <div className="wp-page-header">
          <div className="wp-row-between">
            <div>
              <h1>Subcategorias</h1>
              <p>Hierarquia de categorias para organização detalhada dos produtos.</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="wp-badge wp-badge-blue">
                {subcategorias.length} subcategoria{subcategorias.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={abrirCriar}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                disabled={categoriasPai.length === 0}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nova Subcategoria
              </button>
            </div>
          </div>
        </div>

        {categoriasPai.length > 0 && (
          <div className="wp-panel" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <select
              className="wp-input"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              style={{ flex: "0 1 240px", minWidth: 180 }}
            >
              <option value="">Todas as categorias</option>
              {categoriasPai.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
          {subcategorias.length === 0 ? (
            <div className="wp-empty">
              <div className="wp-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                  <line x1="12" y1="11" x2="12" y2="17"/>
                </svg>
              </div>
              <p className="wp-empty-title">Nenhuma subcategoria cadastrada</p>
              <p className="wp-empty-desc">
                {categoriasPai.length === 0
                  ? "Crie pelo menos uma categoria antes de adicionar subcategorias."
                  : "Adicione subcategorias para organizar melhor os produtos."}
              </p>
              {categoriasPai.length > 0 && (
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={abrirCriar}
                  style={{ marginTop: 12 }}
                >
                  Criar primeira subcategoria
                </button>
              )}
            </div>
          ) : subcategoriasFiltradas.length === 0 ? (
            <div className="wp-empty">
              <div className="wp-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="wp-empty-title">Nenhuma subcategoria nesta categoria</p>
              <p className="wp-empty-desc">Selecione outra categoria ou crie uma nova subcategoria.</p>
            </div>
          ) : (
            <table className="wp-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Categoria Pai</th>
                  <th>Ativo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {subcategoriasFiltradas.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>
                        {s.slug}
                      </span>
                    </td>
                    <td>
                      <span className="wp-badge wp-badge-muted">{s.parentCategoryName}</span>
                    </td>
                    <td>
                      {s.isActive !== false ? (
                        <span className="wp-badge wp-badge-blue">Ativo</span>
                      ) : (
                        <span className="wp-badge wp-badge-muted">Inativo</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="wp-btn wp-btn-secondary"
                          onClick={() => abrirEditar(s)}
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          title="Editar subcategoria"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="wp-btn wp-btn-secondary"
                          onClick={() => handleExcluir(s)}
                          style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                          title="Excluir subcategoria"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
      </div>

      {modalAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                {editando ? "Editar Subcategoria" : "Nova Subcategoria"}
              </h2>
              <button
                type="button"
                onClick={fecharModal}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                  Nome
                </label>
                <input
                  type="text"
                  className="wp-input"
                  placeholder="Ex: Cervejas Artesanais"
                  value={form.name}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  style={{ width: "100%" }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                  Slug
                </label>
                <input
                  type="text"
                  className="wp-input"
                  placeholder="cervejas-artesanais"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  style={{ width: "100%", fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Preenchido automaticamente a partir do nome.
                </span>
              </div>

              {!editando && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                    Categoria pai
                  </label>
                  <select
                    className="wp-input"
                    value={form.parentCategoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, parentCategoryId: e.target.value }))}
                    style={{ width: "100%" }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriasPai.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editando && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                    Categoria pai
                  </label>
                  <input
                    type="text"
                    className="wp-input"
                    value={editando.parentCategoryName}
                    disabled
                    style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                    A categoria pai não pode ser alterada na edição.
                  </span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  id="subcategoria-ativo"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="subcategoria-ativo" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--carbon)" }}>
                  Subcategoria ativa
                </label>
              </div>

              {erro && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                }}>
                  {erro}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  className="wp-btn wp-btn-secondary"
                  onClick={fecharModal}
                  disabled={carregando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={handleSalvar}
                  disabled={carregando}
                >
                  {carregando ? "Salvando..." : editando ? "Salvar alterações" : "Criar subcategoria"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
