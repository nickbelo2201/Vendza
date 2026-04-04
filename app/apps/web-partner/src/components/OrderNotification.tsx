"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type Props = {
  storeId: string;
};

type OrderCreatedPayload = {
  publicId: string;
  customerName: string;
  totalCents: number;
  status: string;
};

export function OrderNotification({ storeId }: Props) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [lastOrder, setLastOrder] = useState<OrderCreatedPayload | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const handleOrderCreated = useCallback((data: unknown) => {
    const payload = data as OrderCreatedPayload;
    setCount((prev) => prev + 1);
    setLastOrder(payload);
  }, []);

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:store", storeId);
    });

    socket.on("order:created", handleOrderCreated);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeId, handleOrderCreated]);

  if (count === 0) return null;

  return (
    <button
      onClick={() => {
        setCount(0);
        setLastOrder(null);
        router.push("/pedidos");
      }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "var(--wp-green, #2D6A4F)",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "14px 20px",
        cursor: "pointer",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 9999,
        animation: "wp-slide-in 0.3s ease",
      }}
    >
      <span
        style={{
          background: "#E07B39",
          color: "#fff",
          borderRadius: "50%",
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {count}
      </span>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {count === 1 ? "Novo pedido!" : `${count} novos pedidos!`}
        </div>
        {lastOrder && (
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {lastOrder.customerName} — {lastOrder.publicId}
          </div>
        )}
      </div>
    </button>
  );
}
