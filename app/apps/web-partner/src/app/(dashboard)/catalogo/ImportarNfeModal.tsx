"use client";

import { useState } from "react";
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

type ErroImportacao = { line?: number; message: string };
type ResultadoImportacao = { imported: number; errors: ErroImportacao[] };

type Props = { aberto: boolean; onFechar: () => void; onConcluido: () => void };

export function ImportarNfeModal({ aberto, onFechar, onConcluido }: Props) {
  const [xmlContent, setXmlContent] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  async function handleImportar() {
    if (!xmlContent.trim()) { setErro("Cole o conteúdo XML da NF-e antes de importar."); return; }
    setImportando(true); setErro(null); setResultado(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v1/partner/nfe/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ xmlContent }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = `Erro ${res.status}`;
        try { const json = JSON.parse(text); msg = json.message ?? json.error ?? msg; } catch { /* ignorar parse error */ }
        setErro(msg); return;
      }
      const json = await res.json();
      const data = json.data as ResultadoImportacao;
      setResultado(data);
      if (data.imported > 0) { setXmlContent(""); onConcluido(); }
    } catch { setErro("Erro de conexão. Tente novamente."); } finally { setImportando(false); }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,10,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div style={{ background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: 580, boxShadow: "0 24px 64px rgba(15,23,42,.18)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--carbon)", margin: 0 }}>Importar NF-e</h2>
          <button type="button" onClick={onFechar} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Info box */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "var(--cream)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--blue)", flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 13, color: "var(--carbon)" }}>
              Abra o arquivo XML da NF-e no editor de texto, selecione tudo (Ctrl+A) e cole abaixo. O sistema vai extrair automaticamente os dados dos produtos.
            </span>
          </div>
          {/* Textarea */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--carbon)", display: "block", marginBottom: 8 }}>Conteúdo XML da NF-e</label>
            <textarea
              className="wp-input"
              value={xmlContent}
              onChange={(e) => { setXmlContent(e.target.value); setErro(null); setResultado(null); }}
              placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc ...>\n  ...\n</nfeProc>`}
              rows={12}
              style={{ width: "100%", resize: "vertical", fontFamily: "'Space Grotesk', monospace", fontSize: 12, minHeight: 220 }}
            />
            {xmlContent && <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>{xmlContent.length.toLocaleString("pt-BR")} caracteres</span>}
          </div>
          {/* Erro */}
          {erro && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {erro}
            </div>
          )}
          {/* Resultado */}
          {resultado && (
            <div style={{ background: resultado.imported > 0 ? "#f0fdf4" : "#fefce8", border: `1px solid ${resultado.imported > 0 ? "#bbf7d0" : "#fef08a"}`, borderRadius: 8, padding: "14px 18px" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: resultado.imported > 0 ? "#16a34a" : "#ca8a04" }}>
                {resultado.imported > 0 ? `${resultado.imported} produto${resultado.imported !== 1 ? "s" : ""} importado${resultado.imported !== 1 ? "s" : ""} com sucesso` : "Nenhum produto importado"}
              </span>
              {resultado.errors.length > 0 && (
                <ul style={{ margin: "8px 0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  {resultado.errors.map((e, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#92400e" }}>
                      {e.line !== undefined && <span style={{ fontWeight: 600 }}>Linha {e.line}: </span>}
                      {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <button type="button" className="wp-btn wp-btn-secondary" onClick={onFechar} disabled={importando}>Cancelar</button>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={handleImportar}
            disabled={importando || !xmlContent.trim()}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {importando ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Importando...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Importar Produtos
              </>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
