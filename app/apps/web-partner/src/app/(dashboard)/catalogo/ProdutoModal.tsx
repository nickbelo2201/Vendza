"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { createClient } from "../../../utils/supabase/client";

import { criarProduto, editarProduto } from "./actions";

type Categoria = { id: string; name: string; slug: string };

type ProdutoForm = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  listPriceCents: number;
  salePriceCents: number | null;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  produto?: ProdutoForm | null;
  categorias: Categoria[];
};

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function centavosParaReais(centavos: number | null): string {
  if (centavos === null || centavos === 0) return "";
  return (centavos / 100).toFixed(2).replace(".", ",");
}

function reaisParaCentavos(valor: string): number {
  const limpo = valor.replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export function ProdutoModal({ aberto, onFechar, produto, categorias }: Props) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    if (produto) {
      setNome(produto.name);
      setSlug(produto.slug);
      setSlugManual(true);
      setCategoryId(produto.categoryId ?? "");
      setListPrice(centavosParaReais(produto.listPriceCents));
      setSalePrice(centavosParaReais(produto.salePriceCents));
      setImageUrl(produto.imageUrl ?? "");
      setIsAvailable(produto.isAvailable);
      setIsFeatured(produto.isFeatured);
    } else {
      setNome("");
      setSlug("");
      setSlugManual(false);
      setCategoryId(categorias[0]?.id ?? "");
      setListPrice("");
      setSalePrice("");
      setImageUrl("");
      setIsAvailable(true);
      setIsFeatured(false);
    }
    setErro(null);
  }, [aberto, produto, categorias]);

  function handleNomeChange(v: string) {
    setNome(v);
    if (!slugManual) {
      setSlug(gerarSlug(v));
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);
    setUploadando(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const identificador = produto?.id ?? `temp_${Date.now()}`;
      const path = `${identificador}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      setImageUrl(publicUrl);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadando(false);
      // Limpar o input para permitir reenvio do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome.trim()) { setErro("Nome é obrigatório."); return; }
    const listPriceCents = reaisParaCentavos(listPrice);
    if (!listPriceCents) { setErro("Preço de lista é obrigatório."); return; }

    const body = {
      name: nome.trim(),
      slug: slug || gerarSlug(nome.trim()),
      categoryId: categoryId || undefined,
      listPriceCents,
      salePriceCents: salePrice ? reaisParaCentavos(salePrice) : null,
      imageUrl: imageUrl.trim() || null,
      isAvailable,
      isFeatured,
    };

    setSalvando(true);
    try {
      if (produto?.id) {
        await editarProduto(produto.id, body);
      } else {
        await criarProduto(body);
      }
      router.refresh();
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

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
          width: "100%", maxWidth: 520,
          boxShadow: "0 24px 64px rgba(15,23,42,.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--carbon)" }}>
            {produto?.id ? "Editar produto" : "Novo produto"}
          </h2>
          <button
            type="button" onClick={onFechar}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div className="wp-stack">
            <div className="wp-form-group">
              <label className="wp-label">Nome *</label>
              <input
                className="wp-input"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Vinho Cabernet Sauvignon"
                required
              />
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Slug</label>
              <input
                className="wp-input"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="ex: vinho-cabernet-sauvignon"
                style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 13 }}
              />
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Categoria</label>
              <select
                className="wp-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="wp-form-group">
                <label className="wp-label">Preço de lista (R$) *</label>
                <input
                  className="wp-input"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  required
                />
              </div>
              <div className="wp-form-group">
                <label className="wp-label">Preço de venda (R$)</label>
                <input
                  className="wp-input"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Imagem do produto</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Upload de arquivo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className="wp-btn wp-btn-secondary"
                    style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                    disabled={uploadando || salvando}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {uploadando ? "Enviando..." : "Selecionar arquivo"}
                  </button>
                  {imageUrl && !uploadando && (
                    <span style={{ fontSize: 12, color: "var(--g)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: "middle", marginRight: 4 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Imagem carregada
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </div>
                {/* Preview da imagem */}
                {imageUrl && (
                  <div style={{
                    width: 72, height: 72, borderRadius: 8,
                    border: "1px solid var(--s6)", overflow: "hidden",
                    background: "var(--s7)",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                {/* Fallback: URL manual */}
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                    Ou colar URL diretamente
                  </label>
                  <input
                    className="wp-input"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                Disponível
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Destaque
              </label>
            </div>

            {erro && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 13, color: "#dc2626",
              }}>
                {erro}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <button type="button" className="wp-btn wp-btn-secondary" onClick={onFechar} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="wp-btn wp-btn-primary" disabled={salvando || uploadando}>
                {salvando ? "Salvando..." : uploadando ? "Aguardando upload..." : (produto?.id ? "Salvar alterações" : "Criar produto")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
