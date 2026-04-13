"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// FAB fixo no canto inferior direito — atalho para criar novo pedido
// Suporta Ctrl+N / Cmd+N como atalho de teclado
export function NovoPedidoFAB() {
  const router = useRouter();

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        router.push("/pedidos");
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [router]);

  return (
    <a
      href="/pedidos"
      aria-label="Criar novo pedido"
      title="Criar novo pedido (Ctrl+N)"
      className="fab-novo-pedido"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <style>{`
        .fab-novo-pedido {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 100;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--v2-green, #2D5A3D);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(45,90,61,.35);
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .fab-novo-pedido:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(45,90,61,.45);
        }
        .fab-novo-pedido:active {
          transform: scale(0.96);
        }
      `}</style>
    </a>
  );
}
