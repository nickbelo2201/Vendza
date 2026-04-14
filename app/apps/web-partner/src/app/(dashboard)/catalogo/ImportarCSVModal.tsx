"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import { createClient } from "../../../utils/supabase/client";

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Passo = "upload" | "mapeamento" | "validacao" | "progresso" | "concluido";

type LinhaCsv = Record<string, string>;

type Mapeamento = {
  nome: string;
  precoVenda: string;
  precoLista: string;
  categoria: string;
  disponivel: string;
  descricao: string;
};

type LinhaValidada = {
  linha: number;
  nome: string;
  listPriceCents: number;
  salePriceCents: number | null;
  categoryName: string | null;
  isAvailable: boolean;
  description: string | null;
  valida: boolean;
  erro: string | null;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onConcluido: () => void;
};

// ─── Template CSV para download ──────────────────────────────────────────────

const TEMPLATE_CSV = `nome,preco_venda,preco_lista,categoria,disponivel,descricao
Cerveja Heineken 600ml,12.90,14.90,Cervejas,sim,Cerveja premium importada
Água Mineral 500ml,3.50,,Águas,sim,Água mineral sem gás
Refrigerante Coca-Cola 2L,9.90,11.00,Refrigerantes,sim,
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-importacao-vendza.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Parser de arquivo ───────────────────────────────────────────────────────

async function parseArquivo(file: File): Promise<{ colunas: string[]; linhas: LinhaCsv[] }> {
  const extensao = file.name.split(".").pop()?.toLowerCase();

  if (extensao === "xlsx" || extensao === "xls") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
          if (!sheet) { reject(new Error("Planilha vazia.")); return; }
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
          const primeiraLinha = json[0];
          const colunas = primeiraLinha ? Object.keys(primeiraLinha) : [];
          const linhas = json.map((row) =>
            Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "")]))
          );
          resolve({ colunas, linhas });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
      reader.readAsArrayBuffer(file);
    });
  }

  return new Promise((resolve, reject) => {
    Papa.parse<LinhaCsv>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const colunas = result.meta.fields ?? [];
        resolve({ colunas, linhas: result.data });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

// ─── Validador de linha ──────────────────────────────────────────────────────

function validarLinhas(linhas: LinhaCsv[], mapeamento: Mapeamento): LinhaValidada[] {
  return linhas.map((linha, idx) => {
    const numero = idx + 2;
    const nome = (mapeamento.nome ? (linha[mapeamento.nome] ?? "") : "").trim();
    const precoVendaRaw = mapeamento.precoVenda ? (linha[mapeamento.precoVenda] ?? "") : "";
    const precoListaRaw = mapeamento.precoLista ? (linha[mapeamento.precoLista] ?? "") : "";
    const categoriaNome = mapeamento.categoria ? (linha[mapeamento.categoria] ?? "").trim() : "";
    const disponivel = mapeamento.disponivel ? (linha[mapeamento.disponivel] ?? "sim").trim().toLowerCase() : "sim";
    const descricao = mapeamento.descricao ? (linha[mapeamento.descricao] ?? "").trim() : "";

    if (!nome) {
      return { linha: numero, nome: "", listPriceCents: 0, salePriceCents: null, categoryName: null, isAvailable: true, description: null, valida: false, erro: "Nome obrigatório" };
    }

    const precoVenda = parseFloat(precoVendaRaw.replace(",", "."));
    if (isNaN(precoVenda) || precoVenda <= 0) {
      return { linha: numero, nome, listPriceCents: 0, salePriceCents: null, categoryName: null, isAvailable: true, description: null, valida: false, erro: "Preço de venda inválido" };
    }

    const listPriceCents = Math.round(precoVenda * 100);
    const precoLista = precoListaRaw ? parseFloat(precoListaRaw.replace(",", ".")) : null;
    const salePriceCents = precoLista && !isNaN(precoLista) && precoLista > 0 ? Math.round(precoLista * 100) : null;

    return {
      linha: numero,
      nome,
      listPriceCents,
      salePriceCents,
      categoryName: categoriaNome || null,
      isAvailable: disponivel !== "nao" && disponivel !== "não" && disponivel !== "no" && disponivel !== "false" && disponivel !== "0",
      description: descricao || null,
      valida: true,
      erro: null,
    };
  });
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ImportarCSVModal({ aberto, onFechar, onConcluido }: Props) {
  const [passo, setPasso] = useState<Passo>("upload");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [colunas, setColunas] = useState<string[]>([]);
  const [preview, setPreview] = useState<LinhaCsv[]>([]);
  const [todasLinhas, setTodasLinhas] = useState<LinhaCsv[]>([]);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [parseando, setParseando] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [mapeamento, setMapeamento] = useState<Mapeamento>({
    nome: "", precoVenda: "", precoLista: "", categoria: "", disponivel: "", descricao: "",
  });

  const [linhasValidadas, setLinhasValidadas] = useState<LinhaValidada[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [resultadoFinal, setResultadoFinal] = useState<{ imported: number; errors: { line: number; message: string }[] } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const resetar = useCallback(() => {
    setPasso("upload");
    setArquivo(null);
    setColunas([]);
    setPreview([]);
    setTodasLinhas([]);
    setErroUpload(null);
    setMapeamento({ nome: "", precoVenda: "", precoLista: "", categoria: "", disponivel: "", descricao: "" });
    setLinhasValidadas([]);
    setProgresso(0);
    setResultadoFinal(null);
  }, []);

  async function processarArquivo(file: File) {
    setParseando(true);
    setErroUpload(null);
    try {
      const { colunas: cols, linhas } = await parseArquivo(file);
      if (cols.length === 0) {
        setErroUpload("Arquivo vazio ou sem cabeçalho.");
        return;
      }
      if (linhas.length === 0) {
        setErroUpload("Nenhuma linha de dados encontrada.");
        return;
      }
      if (linhas.length > 1000) {
        setErroUpload("Limite de 1.000 linhas por importação.");
        return;
      }
      setColunas(cols);
      setPreview(linhas.slice(0, 5));
      setTodasLinhas(linhas);
      setArquivo(file);

      // Tenta auto-mapear colunas com nomes conhecidos
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
      const autoMap = (targets: string[]): string => cols.find((c) => targets.includes(normalize(c))) ?? "";

      setMapeamento({
        nome: autoMap(["nome", "name", "produto", "descricao_produto", "produto_nome"]),
        precoVenda: autoMap(["preco_venda", "preco", "price", "valor", "valor_venda", "sale_price"]),
        precoLista: autoMap(["preco_lista", "list_price", "preco_original"]),
        categoria: autoMap(["categoria", "category", "grupo", "tipo"]),
        disponivel: autoMap(["disponivel", "available", "ativo", "active", "status"]),
        descricao: autoMap(["descricao", "description", "obs", "observacao"]),
      });

      setPasso("mapeamento");
    } catch (err) {
      setErroUpload(err instanceof Error ? err.message : "Erro ao processar arquivo.");
    } finally {
      setParseando(false);
    }
  }

  function handleArquivo(file: File | undefined) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      setErroUpload("Apenas arquivos .csv, .xlsx ou .xls são aceitos.");
      return;
    }
    processarArquivo(file);
  }

  function avancarParaValidacao() {
    if (!mapeamento.nome || !mapeamento.precoVenda) return;
    const validadas = validarLinhas(todasLinhas, mapeamento);
    setLinhasValidadas(validadas);
    setPasso("validacao");
  }

  async function iniciarImportacao() {
    const validas = linhasValidadas.filter((l) => l.valida);
    if (validas.length === 0) return;

    setPasso("progresso");
    setProgresso(0);

    // Importa em lotes de 50
    const LOTE = 50;
    const errors: { line: number; message: string }[] = [];
    let imported = 0;

    for (let i = 0; i < validas.length; i += LOTE) {
      const lote = validas.slice(i, i + LOTE);
      try {
        const result = await fetchComAuth<{ imported: number; errors: { line: number; message: string }[] }>(
          "/partner/products/import",
          {
            method: "POST",
            body: JSON.stringify({
              products: lote.map((l) => ({
                name: l.nome,
                listPriceCents: l.listPriceCents,
                salePriceCents: l.salePriceCents,
                categoryName: l.categoryName,
                isAvailable: l.isAvailable,
                description: l.description,
              })),
            }),
          },
        );
        imported += result.imported;
        errors.push(...result.errors);
      } catch (err) {
        errors.push({ line: i + 2, message: err instanceof Error ? err.message : "Erro no lote." });
      }
      setProgresso(Math.round(((i + LOTE) / validas.length) * 100));
    }

    setProgresso(100);
    setResultadoFinal({ imported, errors });
    setPasso("concluido");
    onConcluido();
  }

  if (!aberto) return null;

  const validasCount = linhasValidadas.filter((l) => l.valida).length;
  const errasCount = linhasValidadas.filter((l) => !l.valida).length;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,10,14,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { resetar(); onFechar(); } }}
    >
      <div style={{
        background: "var(--surface)", borderRadius: 16,
        width: "100%", maxWidth: 700, maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(15,23,42,.2)",
        overflow: "hidden",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--night)", marginBottom: 2 }}>Importar produtos via CSV</h2>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {passo === "upload" && "Passo 1 — Selecione o arquivo"}
              {passo === "mapeamento" && `Passo 2 — Mapeamento de colunas · ${todasLinhas.length} linhas`}
              {passo === "validacao" && `Passo 3 — Validação · ${validasCount} válidos · ${errasCount} com erro`}
              {passo === "progresso" && "Importando..."}
              {passo === "concluido" && "Importação concluída"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { resetar(); onFechar(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* ── Passo 1: Upload ── */}
          {passo === "upload" && (
            <div className="wp-stack">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleArquivo(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--g)" : "var(--s5)"}`,
                  borderRadius: 12, padding: "36px 24px",
                  textAlign: "center", cursor: "pointer",
                  background: dragOver ? "rgba(45,106,79,0.04)" : "var(--s8)",
                  transition: "all 0.15s",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--night)", marginBottom: 6 }}>
                  Arraste o arquivo aqui ou clique para selecionar
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Suporta .csv, .xlsx · até 1.000 linhas
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => handleArquivo(e.target.files?.[0])}
              />

              {parseando && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>Processando arquivo...</div>
              )}

              {erroUpload && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
                  {erroUpload}
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <button type="button" onClick={downloadTemplate}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--g)", textDecoration: "underline" }}>
                  Baixar planilha modelo
                </button>
              </div>
            </div>
          )}

          {/* ── Passo 2: Mapeamento ── */}
          {passo === "mapeamento" && (
            <div className="wp-stack">
              {/* Preview */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Preview (primeiras 5 linhas)
                </div>
                <div style={{ overflowX: "auto", border: "1px solid var(--s6)", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "var(--s8)" }}>
                        {colunas.map((col) => (
                          <th key={col} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--s6)", whiteSpace: "nowrap" }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((linha, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--s7)" }}>
                          {colunas.map((col) => (
                            <td key={col} style={{ padding: "5px 10px", color: "var(--night)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {linha[col] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mapeamento */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Mapeamento de colunas
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(
                    [
                      { key: "nome" as const, label: "Nome do produto *", obrigatorio: true },
                      { key: "precoVenda" as const, label: "Preço de venda *", obrigatorio: true },
                      { key: "precoLista" as const, label: "Preço de lista (opcional)", obrigatorio: false },
                      { key: "categoria" as const, label: "Categoria (opcional)", obrigatorio: false },
                      { key: "disponivel" as const, label: "Disponível (opcional)", obrigatorio: false },
                      { key: "descricao" as const, label: "Descrição (opcional)", obrigatorio: false },
                    ] as const
                  ).map(({ key, label, obrigatorio }) => (
                    <div key={key} className="wp-form-group">
                      <label className="wp-label">{label}</label>
                      <select
                        className="wp-input"
                        value={mapeamento[key]}
                        onChange={(e) => setMapeamento((prev) => ({ ...prev, [key]: e.target.value }))}
                        style={{ fontSize: 12 }}
                      >
                        <option value="">{obrigatorio ? "Selecione..." : "(não mapear)"}</option>
                        {colunas.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="wp-btn wp-btn-secondary" onClick={() => setPasso("upload")}>Voltar</button>
                <button
                  type="button" className="wp-btn wp-btn-primary"
                  onClick={avancarParaValidacao}
                  disabled={!mapeamento.nome || !mapeamento.precoVenda}
                >
                  Validar dados
                </button>
              </div>
            </div>
          )}

          {/* ── Passo 3: Validação ── */}
          {passo === "validacao" && (
            <div className="wp-stack">
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a", fontFamily: "'Space Grotesk', sans-serif" }}>{validasCount}</div>
                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Válidos</div>
                </div>
                {errasCount > 0 && (
                  <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#dc2626", fontFamily: "'Space Grotesk', sans-serif" }}>{errasCount}</div>
                    <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Com erro</div>
                  </div>
                )}
              </div>

              <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--s6)", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--s8)", position: "sticky", top: 0 }}>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--s6)", width: 40 }}>Ln</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--s6)" }}>Nome</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--s6)", width: 90 }}>Preço</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--s6)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasValidadas.map((linha) => (
                      <tr
                        key={linha.linha}
                        style={{
                          borderBottom: "1px solid var(--s7)",
                          background: linha.valida ? undefined : "#fef2f2",
                        }}
                      >
                        <td style={{ padding: "5px 10px", color: "var(--text-muted)" }}>{linha.linha}</td>
                        <td style={{ padding: "5px 10px", color: "var(--night)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {linha.nome || "—"}
                        </td>
                        <td style={{ padding: "5px 10px", color: "var(--night)", fontFamily: "'Space Grotesk', sans-serif" }}>
                          {linha.valida ? `R$${(linha.listPriceCents / 100).toFixed(2)}` : "—"}
                        </td>
                        <td style={{ padding: "5px 10px" }}>
                          {linha.valida ? (
                            <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 11 }}>Válido</span>
                          ) : (
                            <span style={{ color: "#dc2626", fontSize: 11 }}>{linha.erro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="wp-btn wp-btn-secondary" onClick={() => setPasso("mapeamento")}>Voltar</button>
                <button
                  type="button" className="wp-btn wp-btn-primary"
                  onClick={iniciarImportacao}
                  disabled={validasCount === 0}
                >
                  {validasCount === 0 ? "Nenhum produto válido" : `Importar ${validasCount} produto${validasCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}

          {/* ── Progresso ── */}
          {passo === "progresso" && (
            <div className="wp-stack" style={{ alignItems: "center", textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--night)", marginBottom: 16 }}>
                Importando produtos... {progresso}%
              </div>
              <div style={{ width: "100%", height: 10, background: "var(--s6)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "var(--g)", borderRadius: 5,
                  width: `${progresso}%`, transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          )}

          {/* ── Concluído ── */}
          {passo === "concluido" && resultadoFinal && (
            <div className="wp-stack" style={{ textAlign: "center" }}>
              <div style={{ padding: "16px 0" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ margin: "0 auto 12px" }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--night)", marginBottom: 6 }}>
                  {resultadoFinal.imported} produto{resultadoFinal.imported !== 1 ? "s" : ""} importado{resultadoFinal.imported !== 1 ? "s" : ""}
                </div>
                {resultadoFinal.errors.length > 0 && (
                  <div style={{ fontSize: 12, color: "#dc2626" }}>
                    {resultadoFinal.errors.length} erro{resultadoFinal.errors.length !== 1 ? "s" : ""} encontrado{resultadoFinal.errors.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <button type="button" className="wp-btn wp-btn-primary" onClick={() => { resetar(); onFechar(); }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
