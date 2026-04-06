"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPCOES: { label: string; value: string }[] = [
  { label: "Todos", value: "" },
  { label: "Pendente", value: "pending" },
  { label: "Confirmado", value: "confirmed" },
  { label: "Preparando", value: "preparing" },
  { label: "A caminho", value: "out_for_delivery" },
  { label: "Entregue", value: "delivered" },
  { label: "Cancelado", value: "cancelled" },
];

export function FiltroStatus({ statusAtivo }: { statusAtivo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selecionar(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`/pedidos?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {OPCOES.map((op) => {
        const ativo = statusAtivo === op.value;
        return (
          <button
            key={op.value}
            type="button"
            onClick={() => selecionar(op.value)}
            className={ativo ? "wp-badge wp-badge-blue" : "wp-badge wp-badge-muted"}
            style={{
              cursor: "pointer",
              border: "none",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: ativo ? 700 : 500,
              padding: "4px 12px",
              borderRadius: 6,
              transition: "all 0.15s",
            }}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
