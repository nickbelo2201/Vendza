"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletarProduto } from "./actions";

type Props = { produtoId: string; nomeProduto: string };

export function BotaoDeletar({ produtoId, nomeProduto }: Props) {
  const router = useRouter();
  const [fase, setFase] = useState<"idle" | "confirmar" | "deletando">("idle");
  const [erroDelete, setErroDelete] = useState<string | null>(null);

  async function handleConfirmar() {
    setFase("deletando");
    setErroDelete(null);
    try {
      await deletarProduto(produtoId);
      router.refresh();
    } catch (err) {
      console.error("Erro ao deletar produto:", err);
      setErroDelete("Não foi possível deletar. Tente novamente.");
      setFase("idle");
    }
  }

  if (fase === "confirmar") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          className="wp-btn wp-btn-danger"
          onClick={handleConfirmar}
          style={{ fontSize: 12, padding: "4px 10px" }}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="wp-btn"
          onClick={() => { setFase("idle"); setErroDelete(null); }}
          style={{ fontSize: 12, padding: "4px 10px" }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        className="wp-btn wp-btn-danger"
        onClick={() => setFase("confirmar")}
        disabled={fase === "deletando"}
        style={{ fontSize: 12, padding: "4px 10px" }}
        title={`Deletar "${nomeProduto}"`}
      >
        {fase === "deletando" ? (
          "..."
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        )}
      </button>
      {erroDelete && (
        <span style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.3 }}>
          {erroDelete}
        </span>
      )}
    </div>
  );
}
