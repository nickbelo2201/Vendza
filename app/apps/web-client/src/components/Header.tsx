"use client";

import { useState } from "react";

import { useCarrinho } from "../context/CarrinhoContext";
import { CartSheet } from "./CartSheet";

type Props = {
  nomeLoja: string;
};

export function Header({ nomeLoja }: Props) {
  const { totalItens } = useCarrinho();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header
        style={{
          background: "var(--blue)",
          color: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <a
          href="/"
          style={{ fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.02em" }}
        >
          {nomeLoja}
        </a>

        <button
          onClick={() => setCartOpen(true)}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#fff",
            borderRadius: "999px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
          }}
        >
          🛒
          {totalItens > 0 && (
            <span
              style={{
                background: "var(--amber)",
                color: "#fff",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {totalItens}
            </span>
          )}
        </button>
      </header>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
