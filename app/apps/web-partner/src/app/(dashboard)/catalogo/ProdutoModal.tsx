"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { createClient } from "../../../utils/supabase/client";

import { BarcodeScanner } from "../../../components/BarcodeScanner";
import { criarProduto, editarProduto } from "./actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

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

type CategoriaFilha = { id: string; name: string; slug: string; parentCategoryId: string | null };

type Categoria = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  children?: CategoriaFilha[];
};

type ProdutoForm = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  parentCategoryId?: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  barcode?: string | null;
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
  const [categoryId, setCategoryId] = useState("");     // ID da categoria pai selecionada
  const [subcategoryId, setSubcategoryId] = useState(""); // ID da subcategoria selecionada
  const [listPrice, setListPrice] = useState("");

  // Apenas categorias raiz (sem pai)
  const categoriasPai = categorias.filter((c) => !c.parentCategoryId);
  // Subcategorias da categoria pai selecionada
  const subcategorias = categoryId
    ? (categoriasPai.find((c) => c.id === categoryId)?.children ?? [])
    : [];
  const [salePrice, setSalePrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [scannerAberto, setScannerAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    if (produto) {
      setNome(produto.name);
      setSlug(produto.slug);
      setSlugManual(true);
      // Se o produto está numa subcategoria, parentCategoryId vem preenchido
      if (produto.parentCategoryId) {
        setCategoryId(produto.parentCategoryId);
        setSubcategoryId(produto.categoryId ?? "");
      } else {
        setCategoryId(produto.categoryId ?? "");
        setSubcategoryId("");
      }
      setListPrice(centavosParaReais(produto.listPriceCents));
      setSalePrice(centavosParaReais(produto.salePriceCents));
      setImageUrl(produto.imageUrl ?? "");
      setIsAvailable(produto.isAvailable);
      setIsFeatured(produto.isFeatured);
      setBarcode(produto.barcode ?? "");
    } else {
      setNome("");
      setSlug("");
      setSlugManual(false);
      setCategoryId("");
      setSubcategoryId("");
      setListPrice("");
      setSalePrice("");
      setImageUrl("");
      setIsAvailable(true);
      setIsFeatured(false);
      setBarcode("");
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
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

      // Comprime a imagem antes do upload
      const blob = await comprimirImagem(file);

      // Solicita URL de upload assinada ao backend (que garante o bucket existe)
      const { signedUrl, token, path, publicUrl } = await fetchComAuth<{
        signedUrl: string;
        token: string;
        path: string;
        publicUrl: string;
      }>("/partner/upload/signed-url", {
        method: "POST",
        body: JSON.stringify({ ext, productId: produto?.id }),
      });

      // Faz upload direto para o Supabase Storage via URL assinada
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .uploadToSignedUrl(path, token, blob, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setImageUrl(publicUrl);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadando(false);
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
      categoryId: subcategoryId || categoryId || undefined,
      listPriceCents,
      salePriceCents: salePrice ? reaisParaCentavos(salePrice) : null,
      imageUrl: imageUrl.trim() || null,
      isAvailable,
      isFeatured,
      barcode: barcode.trim() || null,
    };

    setSalvando(true);
    try {
      if (produto?.id) {
        await editarProduto(produto.id, body);
        toast.success("Produto salvo");
      } else {
        await criarProduto(body);
        toast.success("Produto criado");
      }
      router.refresh();
      onFechar();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar produto.";
      setErro(msg);
      toast.error(msg);
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="wp-form-group">
                <label className="wp-label">Categoria</label>
                <select
                  className="wp-select"
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }}
                >
                  <option value="">Sem categoria</option>
                  {categoriasPai.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="wp-form-group">
                <label className="wp-label">Subcategoria</label>
                <select
                  className="wp-select"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={subcategorias.length === 0}
                >
                  <option value="">Nenhuma</option>
                  {subcategorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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

            <div className="wp-form-group">
              <label className="wp-label">Código de barras (EAN)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="wp-input"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ex: 7891234567890"
                  style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 13 }}
                />
                <button
                  type="button"
                  className="wp-btn wp-btn-secondary"
                  title="Escanear com câmera"
                  onClick={() => setScannerAberto(true)}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/>
                    <path d="M21 15v4a2 2 0 0 1-2 2h-4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/>
                    <line x1="7" y1="12" x2="7" y2="12"/><line x1="12" y1="12" x2="17" y2="12"/>
                  </svg>
                  Escanear
                </button>
              </div>
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

      {scannerAberto && (
        <BarcodeScanner
          onDetected={(codigo) => {
            setBarcode(codigo);
            setScannerAberto(false);
          }}
          onFechar={() => setScannerAberto(false)}
        />
      )}
    </div>
  );
}
