"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletarProduto } from "./actions";

type Props = { produtoId: string; nomeProduto: string };

export function BotaoDeletar({ produtoId, nomeProduto }: Props) {
  const router = useRouter();
  const [deletando, setDeletando] = useState(false);

  async function handleDeletar() {
    const confirmado = confirm(`Deletar "${nomeProduto}"? Esta ação não pode ser desfeita.`);
    if (!confirmado) return;

    setDeletando(true);
    try {
      await deletarProduto(produtoId);
      router.refresh();
    } catch (err) {
      console.error("Erro ao deletar produto:", err);
      alert("Não foi possível deletar o produto. Tente novamente.");
    } finally {
      setDeletando(false);
    }
  }

  return (
    <button
      type="button"
      className="wp-btn wp-btn-danger"
      onClick={handleDeletar}
      disabled={deletando}
      style={{ fontSize: 12, padding: "4px 10px" }}
      title="Deletar produto"
    >
      {deletando ? (
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
  );
}
