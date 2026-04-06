"use client";

import { useState, useTransition } from "react";

import { toggleStatusLoja } from "../app/(dashboard)/configuracoes/actions";

type Props = {
  initialStatus: "open" | "closed";
};

export function ToggleLojaAberta({ initialStatus }: Props) {
  const [status, setStatus] = useState<"open" | "closed">(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const novoStatus: "open" | "closed" = status === "open" ? "closed" : "open";

    startTransition(async () => {
      try {
        await toggleStatusLoja(novoStatus);
        setStatus(novoStatus);
      } catch (err) {
        console.error("Erro ao alterar status da loja:", err);
      }
    });
  }

  const aberta = status === "open";

  return (
    <button
      type="button"
      className="topbar-toggle"
      onClick={handleToggle}
      disabled={isPending}
      style={{
        opacity: isPending ? 0.6 : 1,
        cursor: isPending ? "not-allowed" : "pointer",
        borderColor: aberta ? "var(--v2-green)" : "#9CA3AF",
      }}
      aria-label={aberta ? "Fechar loja" : "Abrir loja"}
    >
      <div className={`topbar-toggle-pill ${aberta ? "on" : "off"}`}>
        <div className="topbar-toggle-dot" />
      </div>
      <span
        className="topbar-toggle-label"
        style={{ color: aberta ? "var(--v2-green)" : "var(--v2-text-sec)" }}
      >
        {isPending ? "Aguarde..." : aberta ? "Loja Aberta" : "Loja Fechada"}
      </span>
    </button>
  );
}
