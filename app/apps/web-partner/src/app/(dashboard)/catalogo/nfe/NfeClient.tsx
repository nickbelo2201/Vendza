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
    <div className="wp-nfe-root">

      {/* Cabeçalho da seção */}
      <div>
        <h2 className="wp-nfe-heading-title">Importar NF-e</h2>
        <p className="wp-nfe-heading-sub">
          Cole o XML da nota fiscal eletrônica para importar produtos automaticamente no catálogo.
        </p>
      </div>

      {/* Painel principal */}
      <div className="wp-nfe-panel">

        {/* Dica de uso */}
        <div className="wp-nfe-tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Como usar:</strong> Abra o arquivo XML da NF-e no Bloco de Notas ou editor de texto, selecione tudo (Ctrl+A), copie (Ctrl+C) e cole abaixo (Ctrl+V). O sistema extrai automaticamente os dados dos produtos.
          </span>
        </div>

        {/* Textarea XML */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label className="wp-nfe-label">
              Conteúdo XML da NF-e
            </label>
            {xmlContent && (
              <button
                type="button"
                onClick={handleLimpar}
                className="wp-nfe-btn-clear"
              >
                Limpar
              </button>
            )}
          </div>
          <textarea
            className="wp-nfe-textarea"
            value={xmlContent}
            onChange={(e) => {
              setXmlContent(e.target.value);
              setErro(null);
              setResultado(null);
            }}
            placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc ...>\n  ...\n</nfeProc>`}
            rows={16}
          />
          {xmlContent && (
            <span className="wp-nfe-counter">
              {xmlContent.length.toLocaleString("pt-BR")} caracteres
            </span>
          )}
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div className="wp-nfe-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{erro}</span>
          </div>
        )}

        {/* Resultado da importação */}
        {resultado && (
          <div className={`wp-nfe-result ${resultado.imported > 0 ? "wp-nfe-result--success" : "wp-nfe-result--warning"}`}>
            <div className="wp-nfe-result-title">
              {resultado.imported > 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span>
                {resultado.imported > 0
                  ? `${resultado.imported} produto${resultado.imported !== 1 ? "s" : ""} importado${resultado.imported !== 1 ? "s" : ""} com sucesso`
                  : "Nenhum produto importado"}
              </span>
            </div>
            {resultado.errors.length > 0 && (
              <div>
                <p className="wp-nfe-result-errors-title">
                  {resultado.errors.length} erro{resultado.errors.length !== 1 ? "s" : ""} encontrado{resultado.errors.length !== 1 ? "s" : ""}:
                </p>
                <ul className="wp-nfe-result-errors-list">
                  {resultado.errors.map((e, i) => (
                    <li key={i}>
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
            className="wp-nfe-btn-import"
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
