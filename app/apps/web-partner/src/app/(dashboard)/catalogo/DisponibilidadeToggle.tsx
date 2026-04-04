"use client";

import { useTransition } from "react";

import { alterarDisponibilidade } from "./actions";

type Props = { productId: string; isAvailable: boolean };

export function DisponibilidadeToggle({ productId, isAvailable }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => { alterarDisponibilidade(productId, !isAvailable); });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`wp-button wp-button-sm ${isAvailable ? "" : "wp-button-secondary"}`}
      style={{ opacity: pending ? 0.6 : 1, cursor: pending ? "wait" : "pointer" }}
    >
      {pending ? "..." : isAvailable ? "✓ Disponível" : "Indisponível"}
    </button>
  );
}
