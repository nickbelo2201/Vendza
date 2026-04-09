"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { createClient } from "../utils/supabase/client";

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

function tocarBeep() {
  try {
    if (typeof window === "undefined") return;
    const ctx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // ignora se Web Audio não disponível
  }
}

export function OrderNotification({ storeId }: Props) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [lastOrder, setLastOrder] = useState<OrderCreatedPayload | null>(null);
  const [somAtivo, setSomAtivo] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("vendza_som_notif") !== "false";
  });
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const interagiu = useRef(false);

  useEffect(() => {
    const marcarInteracao = () => {
      interagiu.current = true;
    };
    document.addEventListener("click", marcarInteracao, { once: true });
    return () => {
      document.removeEventListener("click", marcarInteracao);
    };
  }, []);

  const handleOrderCreated = useCallback(
    (data: unknown) => {
      const payload = data as OrderCreatedPayload;
      setCount((prev) => prev + 1);
      setLastOrder(payload);
      if (somAtivo && interagiu.current) tocarBeep();
    },
    [somAtivo]
  );

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;

    async function conectar() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      socket = io(API_URL, {
        transports: ["websocket", "polling"],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on("order:created", handleOrderCreated);
    }

    conectar();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [storeId, handleOrderCreated]);

  function alternarSom() {
    setSomAtivo((prev) => {
      const proximo = !prev;
      localStorage.setItem("vendza_som_notif", proximo ? "true" : "false");
      return proximo;
    });
  }

  if (count === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "var(--wp-green, #2D6A4F)",
        color: "#fff",
        borderRadius: 12,
        padding: "14px 20px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 9999,
        animation: "wp-slide-in 0.3s ease",
      }}
    >
      <button
        onClick={() => {
          setCount(0);
          setLastOrder(null);
          router.push("/pedidos");
        }}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 0,
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

      <button
        onClick={alternarSom}
        title={somAtivo ? "Desativar som" : "Ativar som"}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: 4,
          marginLeft: 4,
          opacity: 0.85,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {somAtivo ? (
          // Ícone sino ativo
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ) : (
          // Ícone sino com risco (mudo)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </button>
    </div>
  );
}
