"use client";

import { useState } from "react";
import { formatCurrency } from "@vendza/utils";

import { useCarrinho } from "../context/CarrinhoContext";

type Props = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPriceCents: number;
};

export function BotaoAdicionarAoCarrinho({ productId, name, slug, imageUrl, unitPriceCents }: Props) {
  const { adicionarItem } = useCarrinho();
  const [adicionado, setAdicionado] = useState(false);

  function handleClick() {
    adicionarItem({ productId, name, slug, imagemUrl: imageUrl, unitPriceCents });
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  }

  return (
    <button
      className="wc-btn wc-btn-primary"
      style={{ width: "100%" }}
      onClick={handleClick}
    >
      {adicionado ? `✓ ${formatCurrency(unitPriceCents)} — Adicionado!` : "Adicionar ao carrinho"}
    </button>
  );
}
