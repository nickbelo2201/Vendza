"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type ErroImportacao = {
  line?: number;
  message: string;
};

type ResultadoImportacao = {
  imported: number;
  errors: ErroImportacao[];
};

export function NfeClient() {
  const [xmlContent, setXmlContent] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleImportar() {
    if (!xmlContent.trim()) {
      setErro("Cole o conteúdo XML da NF-e antes de importar.");
      return;
    }
    setImportando(true);
    setErro(null);
    setResultado(null);
    try {
      const res = await fetch(`${API_URL}/v1/partner/nfe/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = `Erro ${res.status}`;
        try { const json = JSON.parse(text); msg = json.message ?? json.error ?? msg; } catch { /* ignorar */ }
        setErro(msg);
        return;
      }
      const json = await res.json();
      const data = json.data as ResultadoImportacao;
      setResultado(data);
      if (data.imported > 0) setXmlContent("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setImportando(false);
    }
  }

  function handleLimpar() {
    setXmlContent("");
    setResultado(null);
    setErro(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Cabeçalho da seção */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
          Importar NF-e
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Cole o XML da nota fiscal eletrônica para importar produtos automaticamente no catálogo.
        </p>
      </div>

      {/* Painel principal */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>

        {/* Dica de uso */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "14px 16px",
          background: "#f0fdf4",
          borderRadius: 8,
          border: "1px solid #bbf7d0",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontSize: 13, color: "#15803d", lineHeight: 1.5 }}>
            <strong>Como usar:</strong> Abra o arquivo XML da NF-e no Bloco de Notas ou editor de texto, selecione tudo (Ctrl+A), copie (Ctrl+C) e cole abaixo (Ctrl+V). O sistema extrai automaticamente os dados dos produtos.
          </span>
        </div>

        {/* Textarea XML */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
              Conteúdo XML da NF-e
            </label>
            {xmlContent && (
              <button
                type="button"
                onClick={handleLimpar}
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "3px 10px",
                  cursor: "pointer",
                }}
              >
                Limpar
              </button>
            )}
          </div>
          <textarea
            value={xmlContent}
            onChange={(e) => {
              setXmlContent(e.target.value);
              setErro(null);
              setResultado(null);
            }}
            placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc ...>\n  ...\n</nfeProc>`}
            rows={16}
            style={{
              width: "100%",
              resize: "vertical",
              fontFamily: "'Space Grotesk', 'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: "#0f172a",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "12px 14px",
              outline: "none",
              minHeight: 320,
              boxSizing: "border-box",
            }}
          />
          {xmlContent && (
            <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
              {xmlContent.length.toLocaleString("pt-BR")} caracteres
            </span>
          )}
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span style={{ fontSize: 13, color: "#dc2626" }}>{erro}</span>
          </div>
        )}

        {/* Resultado da importação */}
        {resultado && (
          <div style={{
            background: resultado.imported > 0 ? "#f0fdf4" : "#fefce8",
            border: `1px solid ${resultado.imported > 0 ? "#bbf7d0" : "#fef08a"}`,
            borderRadius: 8,
            padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: resultado.errors.length > 0 ? 12 : 0 }}>
              {resultado.imported > 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: resultado.imported > 0 ? "#16a34a" : "#ca8a04" }}>
                {resultado.imported > 0
                  ? `${resultado.imported} produto${resultado.imported !== 1 ? "s" : ""} importado${resultado.imported !== 1 ? "s" : ""} com sucesso`
                  : "Nenhum produto importado"}
              </span>
            </div>
            {resultado.errors.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>
                  {resultado.errors.length} erro{resultado.errors.length !== 1 ? "s" : ""} encontrado{resultado.errors.length !== 1 ? "s" : ""}:
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {resultado.errors.map((e, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#92400e" }}>
                      {e.line !== undefined && <span style={{ fontWeight: 600 }}>Linha {e.line}: </span>}
                      {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Botão de ação */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button
            type="button"
            onClick={handleImportar}
            disabled={importando || !xmlContent.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: importando || !xmlContent.trim() ? "#e2e8f0" : "#2d6a4f",
              color: importando || !xmlContent.trim() ? "#94a3b8" : "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: importando || !xmlContent.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {importando ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "nfe-spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Importando...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Importar Produtos da NF-e
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes nfe-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
