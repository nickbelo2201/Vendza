"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const POLLING_INTERVAL_MS = 15_000;
const STATUS_FINAIS = new Set(["delivered", "cancelled"]);

type TimelineEvent = {
  type: string;
  label: string;
  createdAt: string;
};

type Props = {
  publicId: string;
  initialTimeline: TimelineEvent[];
  initialStatus: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready_for_delivery: "Pronto para entrega",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--amber)",
  confirmed: "var(--blue)",
  preparing: "var(--blue)",
  ready_for_delivery: "var(--green)",
  out_for_delivery: "var(--green)",
  delivered: "var(--green)",
  cancelled: "#dc2626",
};

export function OrderTracker({ publicId, initialTimeline, initialStatus }: Props) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);
  const [status, setStatus] = useState(initialStatus);
  const [atualizando, setAtualizando] = useState(false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const statusRef = useRef(initialStatus);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:order", publicId);
    });

    socket.on("order:status_changed", (data: { status: string; updatedAt: string }) => {
      setStatus(data.status);
      setTimeline((prev) => [
        {
          type: data.status,
          label: STATUS_LABELS[data.status] ?? data.status,
          createdAt: data.updatedAt,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [publicId]);

  useEffect(() => {
    if (STATUS_FINAIS.has(initialStatus)) return;

    const poll = async () => {
      if (STATUS_FINAIS.has(statusRef.current)) return;

      setAtualizando(true);
      try {
        const res = await fetch(`${API_URL}/v1/orders/${publicId}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const order = json.data as { status: string; timeline: TimelineEvent[] };
        setStatus(order.status);
        setTimeline(order.timeline);
      } catch {
        // falha silenciosa — próximo ciclo tenta novamente
      } finally {
        setAtualizando(false);
      }
    };

    const intervalId = setInterval(poll, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [publicId, initialStatus]);

  const statusColor = STATUS_COLORS[status] ?? "var(--text-muted)";
  const statusLabel = STATUS_LABELS[status] ?? status;
  const isFinal = STATUS_FINAIS.has(status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status atual */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 20px",
          borderRadius: "var(--radius-md)",
          background: `${statusColor}18`,
          border: `1px solid ${statusColor}44`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: statusColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 700, color: statusColor }}>{statusLabel}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: "auto" }}>
          {isFinal ? "Status final" : atualizando ? "Atualizando..." : "Atualiza automaticamente"}
        </span>
      </div>

      {/* Timeline */}
      <div className="wc-timeline">
        {timeline.map((event, idx) => (
          <div key={event.type + event.createdAt} className="wc-timeline-item">
            <div className={`wc-timeline-dot ${idx === 0 ? "active" : ""}`} />
            <div>
              <p style={{ margin: "0 0 2px", fontWeight: 600, color: "var(--carbon)", fontSize: 15 }}>
                {event.label}
              </p>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                {new Date(event.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
