"use client";

import { toast } from "sonner";

type Props = {
  statusFiltro?: string;
};

export function BotaoExportarCSV({ statusFiltro }: Props) {
  function handleExportar() {
    const url = `/api/exportar-pedidos${statusFiltro ? `?status=${statusFiltro}` : ""}`;
    const link = document.createElement("a");
    link.href = url;
    link.click();
    toast.success("CSV exportado");
  }

  return (
    <button
      type="button"
      onClick={handleExportar}
      className="wp-btn wp-btn-secondary"
      style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exportar CSV
    </button>
  );
}
