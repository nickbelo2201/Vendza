"use client";

import { useState, useRef } from "react";
import type { Categoria } from "@vendza/types";
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

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function comprimirImagem(file: File, maxWidthPx = 1200, qualidade = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxWidthPx / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao comprimir imagem."));
      }, mimeType, qualidade);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Falha ao carregar imagem.")); };
    img.src = url;
  });
}

type FormState = {
  name: string;
  slug: string;
  isActive: boolean;
  imageUrl: string | null;
};

type Props = {
  categorias: Categoria[];
};

export function CategoriasClient({ categorias: categoriasIniciais }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", slug: "", isActive: true, imageUrl: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function recarregar() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v1/partner/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const todas: Categoria[] = json.data ?? [];
        setCategorias(todas.filter((c) => !c.parentCategoryId));
      }
    } catch {}
  }

  function abrirCriar() {
    setEditando(null);
    setForm({ name: "", slug: "", isActive: true, imageUrl: null });
    setErro(null);
    setModalAberto(true);
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setForm({ name: c.name, slug: c.slug, isActive: c.isActive ?? true, imageUrl: c.imageUrl ?? null });
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);
    setUploadando(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

      // Comprime a imagem antes do upload
      const blob = await comprimirImagem(file, 1200, 0.82);

      // Solicita URL de upload assinada ao backend
      const token = await getToken();
      const signedRes = await fetch(`${API_URL}/v1/partner/upload/signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ext }),
      });

      if (!signedRes.ok) {
        const text = await signedRes.text().catch(() => "");
        let mensagem = `Erro ${signedRes.status}`;
        try {
          const json = JSON.parse(text);
          mensagem = json.error?.message ?? json.message ?? mensagem;
        } catch {}
        throw new Error(mensagem);
      }

      const { data: { signedUrl, token: uploadToken, path, publicUrl } } = await signedRes.json();

      // Faz upload direto para o Supabase Storage via URL assinada
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .uploadToSignedUrl(path, uploadToken, blob, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setForm((prev) => ({ ...prev, imageUrl: publicUrl }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

    setCarregando(true);
    setErro(null);

    try {
      const url = editando
        ? `${API_URL}/v1/partner/categories/${editando.id}`
        : `${API_URL}/v1/partner/categories`;

      const body = {
        name: form.name,
        slug: form.slug,
        isActive: form.isActive,
        imageUrl: form.imageUrl,
      };

      const token = await getToken();
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let mensagem = `Erro ${res.status}`;
        try {
          const json = JSON.parse(text);
          mensagem = json.error?.message ?? json.message ?? mensagem;
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

  async function handleExcluir(categoria: Categoria) {
    const confirmado = window.confirm(
      `Excluir a categoria "${categoria.name}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v1/partner/categories/${categoria.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let mensagem = `Erro ${res.status}`;
        try {
          const json = JSON.parse(text);
          mensagem = json.error?.message ?? json.message ?? mensagem;
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
              <h1>Categorias</h1>
              <p>Organize os produtos da loja por tipo.</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="wp-badge wp-badge-blue">
                {categorias.length} categoria{categorias.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={abrirCriar}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nova Categoria
              </button>
            </div>
          </div>
        </div>

        <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
          {categorias.length === 0 ? (
            <div className="wp-empty">
              <div className="wp-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="wp-empty-title">Nenhuma categoria cadastrada</p>
              <p className="wp-empty-desc">Adicione categorias para organizar os produtos da loja.</p>
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={abrirCriar}
                style={{ marginTop: 12 }}
              >
                Criar primeira categoria
              </button>
            </div>
          ) : (
            <table className="wp-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Subcategorias</th>
                  <th>Ativo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "var(--cream)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>
                        {c.slug}
                      </span>
                    </td>
                    <td>
                      {(c.children?.length ?? 0) > 0 ? (
                        <span className="wp-badge wp-badge-muted">
                          {c.children!.length} subcategoria{c.children!.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{"—"}</span>
                      )}
                    </td>
                    <td>
                      {c.isActive !== false ? (
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
                          onClick={() => abrirEditar(c)}
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          title="Editar categoria"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="wp-btn wp-btn-secondary"
                          onClick={() => handleExcluir(c)}
                          style={{ fontSize: 12, padding: "4px 10px", color: "var(--red, #dc2626)" }}
                          title="Excluir categoria"
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
                {editando ? "Editar Categoria" : "Nova Categoria"}
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
                  placeholder="Ex: Cervejas"
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
                  placeholder="cervejas"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  style={{ width: "100%", fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Preenchido automaticamente a partir do nome.
                </span>
              </div>

              {/* Upload de imagem */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--carbon)" }}>
                  Imagem da categoria
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      className="wp-btn wp-btn-secondary"
                      style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                      disabled={uploadando || carregando}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {uploadando ? "Enviando..." : "Selecionar arquivo"}
                    </button>
                    {form.imageUrl && !uploadando && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: null }))}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--red, #dc2626)", padding: 0 }}
                      >
                        Remover foto
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                  </div>
                  {form.imageUrl && (
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      background: "var(--cream)",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  id="categoria-ativo"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="categoria-ativo" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--carbon)" }}>
                  Categoria ativa
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
                  disabled={carregando || uploadando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={handleSalvar}
                  disabled={carregando || uploadando}
                >
                  {carregando ? "Salvando..." : uploadando ? "Aguardando upload..." : editando ? "Salvar alterações" : "Criar categoria"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
