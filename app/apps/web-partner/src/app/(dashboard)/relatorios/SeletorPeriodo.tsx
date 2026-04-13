"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Opcao = { label: string; dias: number };

const OPCOES: Opcao[] = [
  { label: "Hoje", dias: 0 },
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
];

function formatarData(d: Date): string {
  return d.toISOString().substring(0, 10);
}

function formatarDataBR(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export function SeletorPeriodo({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hoje = formatarData(new Date());
  const isHoje = from === hoje && to === hoje;
  const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));

  const isCustom = !isHoje && diff !== 7 && diff !== 30;
  const [modoCustom, setModoCustom] = useState(isCustom);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [exportAberto, setExportAberto] = useState(false);

  function selecionar(dias: number) {
    setModoCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    const agora = new Date();
    const toDate = formatarData(agora);
    const fromDate = dias === 0 ? toDate : formatarData(new Date(agora.getTime() - dias * 86400000));
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/relatorios?${params.toString()}`);
  }

  function aplicarCustom() {
    if (!customFrom || !customTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", customFrom);
    params.set("to", customTo);
    router.push(`/relatorios?${params.toString()}`);
  }

  function isAtivo(dias: number): boolean {
    if (modoCustom) return false;
    if (dias === 0) return isHoje;
    if (dias === 7) return !isHoje && diff === 7;
    if (dias === 30) return !isHoje && diff === 30;
    return false;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {/* Botões rápidos */}
        {OPCOES.map((op) => (
          <button
            key={op.dias}
            type="button"
            onClick={() => selecionar(op.dias)}
            className={isAtivo(op.dias) ? "wp-badge wp-badge-blue" : "wp-badge wp-badge-muted"}
            style={{
              cursor: "pointer",
              border: "none",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: isAtivo(op.dias) ? 700 : 500,
              padding: "4px 14px",
              borderRadius: 6,
              transition: "all 0.15s",
            }}
          >
            {op.label}
          </button>
        ))}

        {/* Botão Personalizado */}
        <button
          type="button"
          onClick={() => setModoCustom((v) => !v)}
          className={modoCustom ? "wp-badge wp-badge-blue" : "wp-badge wp-badge-muted"}
          style={{
            cursor: "pointer",
            border: "none",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: modoCustom ? 700 : 500,
            padding: "4px 14px",
            borderRadius: 6,
            transition: "all 0.15s",
          }}
        >
          Personalizado
        </button>

        {/* Botão Atualizar */}
        <button
          type="button"
          onClick={() => router.refresh()}
          title="Atualizar dados"
          style={{
            cursor: "pointer",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--s8, #f8fafc)",
            padding: "4px 8px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>

        {/* Dropdown Exportar */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setExportAberto((v) => !v)}
            className="wp-btn wp-btn-secondary"
            style={{
              fontSize: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {exportAberto && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "var(--surface, #fff)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "var(--shadow-md, 0 4px 16px rgba(15,23,42,.08))",
                minWidth: 200,
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              <a
                href={`/api/exportar-pedidos?from=${from}&to=${to}`}
                onClick={() => setExportAberto(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--carbon)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                Pedidos (CSV)
              </a>
              <a
                href={`/api/exportar-pedidos?from=${from}&to=${to}&tipo=produtos`}
                onClick={() => setExportAberto(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--carbon)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                Produtos mais vendidos (CSV)
              </a>
              <a
                href={`/api/exportar-pedidos?from=${from}&to=${to}&tipo=clientes`}
                onClick={() => setExportAberto(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--carbon)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                Clientes (CSV)
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Inputs de data personalizada */}
      {modoCustom && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>De</label>
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={{
              fontSize: 12,
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "4px 8px",
              outline: "none",
              background: "var(--s8, #f8fafc)",
              color: "var(--carbon)",
            }}
          />
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>até</label>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{
              fontSize: 12,
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "4px 8px",
              outline: "none",
              background: "var(--s8, #f8fafc)",
              color: "var(--carbon)",
            }}
          />
          <button
            type="button"
            onClick={aplicarCustom}
            className="wp-btn wp-btn-primary"
            style={{ fontSize: 12, padding: "4px 14px", borderRadius: 6 }}
          >
            Aplicar
          </button>
        </div>
      )}

      {/* Label de período */}
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Exibindo dados de{" "}
        <strong style={{ color: "var(--carbon)" }}>{formatarDataBR(from)}</strong>
        {" "}até{" "}
        <strong style={{ color: "var(--carbon)" }}>{formatarDataBR(to)}</strong>
      </div>
    </div>
  );
}
