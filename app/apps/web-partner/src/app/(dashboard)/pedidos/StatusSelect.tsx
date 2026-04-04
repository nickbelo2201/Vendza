"use client";

import { useTransition } from "react";

import { atualizarStatusPedido } from "./actions";

const STATUS_CLASS: Record<string, string> = {
  pending:           "wp-status wp-status-pending",
  confirmed:         "wp-status wp-status-confirmed",
  preparing:         "wp-status wp-status-preparing",
  ready_for_delivery:"wp-status wp-status-ready",
  out_for_delivery:  "wp-status wp-status-out_delivery",
  delivered:         "wp-status wp-status-delivered",
  cancelled:         "wp-status wp-status-cancelled",
};

const ALL_STATUSES = [
  "pending","confirmed","preparing",
  "ready_for_delivery","out_for_delivery","delivered","cancelled",
];

type Props = {
  orderId: string;
  statusAtual: string;
  statusLabel: Record<string, string>;
};

export function StatusSelect({ orderId, statusAtual, statusLabel }: Props) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value;
    startTransition(() => { atualizarStatusPedido(orderId, novo); });
  }

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
      <span className={STATUS_CLASS[statusAtual] ?? "wp-status"} style={{ paddingRight: 28 }}>
        {pending ? "Salvando..." : (statusLabel[statusAtual] ?? statusAtual)}
      </span>
      <svg
        style={{ position: "absolute", right: 8, pointerEvents: "none", opacity: 0.6 }}
        width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      <select
        value={statusAtual}
        onChange={handleChange}
        disabled={pending}
        style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" }}
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>{statusLabel[s] ?? s}</option>
        ))}
      </select>
    </div>
  );
}
