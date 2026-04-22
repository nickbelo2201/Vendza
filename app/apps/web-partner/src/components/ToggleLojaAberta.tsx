"use client";

import { useState, useEffect, useTransition } from "react";

import { toggleStatusLoja } from "../app/(dashboard)/configuracoes/actions";

type Props = {
  initialStatus: "open" | "closed";
};

export function ToggleLojaAberta({ initialStatus }: Props) {
  const [status, setStatus] = useState<"open" | "closed">(initialStatus);

  // Sincroniza quando o Server Component re-renderiza com novo status (via revalidatePath)
  useEffect(() => { setStatus(initialStatus); }, [initialStatus]);
  const [isPending, startTransition] = useTransition();
  const [erroToggle, setErroToggle] = useState<string | null>(null);

  function handleToggle() {
    const statusAnterior = status;
    const novoStatus: "open" | "closed" = status === "open" ? "closed" : "open";

    // Atualização otimista
    setStatus(novoStatus);
    setErroToggle(null);

    startTransition(async () => {
      try {
        await toggleStatusLoja(novoStatus);
      } catch (err) {
        console.error("Erro ao alterar status da loja:", err);
        // Rollback para o estado anterior
        setStatus(statusAnterior);
        setErroToggle("Não foi possível alterar o status. Tente novamente.");
      }
    });
  }

  const aberta = status === "open";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
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
      {erroToggle && (
        <span style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.3 }}>
          {erroToggle}
        </span>
      )}
    </div>
  );
}
