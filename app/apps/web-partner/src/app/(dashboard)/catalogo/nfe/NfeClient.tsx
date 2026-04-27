"use client";

import { useState } from "react";
import Link from "next/link";

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
      setErro("Cole o conteudo XML da NF-e antes de importar.");
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
        let mensagem = `Erro ${res.status}`;
        try {
          const json = JSON.parse(text);
          mensagem = json.message ?? json.error ?? mensagem;
        } catch {}
        setErro(mensagem);
        return;
      }

      const json = await res.json();
      const data = json.data as ResultadoImportacao;
      setResultado(data);
      if (data.imported > 0) {
        setXmlContent("");
      }
    } catch {
      setErro("Erro de conexao. Tente novamente.");
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
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            <Link href="/catalogo" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Catalogo
            </Link>
            {" > Importar NF-e"}
          </span>
        </div>
        <div>
          <h1>Importar NF-e</h1>
          <p>Cole o XML da nota fiscal eletronica para importar produtos automaticamente no catalogo.</p>
        </div>
      </div>

      <div className="wp-panel" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 16px",
            background: "var(--cream)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--blue)", flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13, color: "var(--carbon)" }}>
              <strong>Como usar:</strong> Abra o arquivo XML da NF-e no editor de texto, selecione todo o conteudo (Ctrl+A) e cole abaixo. O sistema vai extrair automaticamente os dados dos produtos.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--carbon)" }}>
                Conteudo XML da NF-e
              </label>
              {xmlContent && (
                <button
                  type="button"
                  className="wp-btn wp-btn-secondary"
                  onClick={handleLimpar}
                  style={{ fontSize: 12, padding: "3px 10px" }}
                >
                  Limpar
                </button>
              )}
            </div>
            <textarea
              className="wp-input"
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
                fontFamily: "'Space Grotesk', monospace",
                fontSize: 12,
                minHeight: 300,
              }}
            />
            {xmlContent && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                {xmlContent.length.toLocaleString("pt-BR")} caracteres colados
              </span>
            )}
          </div>

          {erro && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 13,
              color: "#dc2626",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {erro}
            </div>
          )}

          {resultado && (
            <div style={{
              background: resultado.imported > 0 ? "#f0fdf4" : "#fefce8",
              border: `1px solid ${resultado.imported > 0 ? "#bbf7d0" : "#fef08a"}`,
              borderRadius: 8,
              padding: "16px 20px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: resultado.errors.length > 0 ? 12 : 0,
              }}>
                {resultado.imported > 0 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#16a34a", flexShrink: 0 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#ca8a04", flexShrink: 0 }}>
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
                        {e.line !== undefined && (
                          <span style={{ fontWeight: 600 }}>Linha {e.line}: </span>
                        )}
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
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
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Importando...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  Importar Produtos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
