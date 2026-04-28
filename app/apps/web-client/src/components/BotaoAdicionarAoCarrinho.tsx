"use client";

import { useState } from "react";
import { formatCurrency, calcularPrecoComFardo } from "@vendza/utils";
import type { BundlePublico } from "@vendza/types";

import { useCarrinho, melhorBundleParaQtd } from "../context/CarrinhoContext";

type Props = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPriceCents: number;
  bundles?: BundlePublico[];
};

export function BotaoAdicionarAoCarrinho({ productId, name, slug, imageUrl, unitPriceCents, bundles }: Props) {
  const { adicionarItem } = useCarrinho();
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  const bundleAtivo = melhorBundleParaQtd(bundles, quantidade);
  const totalCents = bundleAtivo
    ? calcularPrecoComFardo({
        quantidade,
        precoAvulsoCents: unitPriceCents,
        bundlePriceCents: bundleAtivo.bundlePriceCents,
        quantidadeFardo: bundleAtivo.quantity,
      }).totalCents
    : unitPriceCents * quantidade;

  const temDesconto = bundleAtivo !== null && totalCents < unitPriceCents * quantidade;

  function decrement() {
    setQuantidade((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantidade((q) => q + 1);
  }

  function handleAdicionar() {
    adicionarItem({ productId, name, slug, imagemUrl: imageUrl, unitPriceCents, quantity: quantidade, bundles });
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Badge de fardo */}
      {bundleAtivo && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 8,
          background: "color-mix(in srgb, var(--green) 10%, transparent)",
          border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
          fontSize: 13,
          color: "var(--green)",
          fontWeight: 600,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          {bundleAtivo.name} — preço especial aplicado!
        </div>
      )}

      {/* Economia calculada */}
      {temDesconto && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
          <span>
            <s>{formatCurrency(unitPriceCents * quantidade)}</s>
          </span>
          <span style={{ color: "var(--green)", fontWeight: 700 }}>
            {formatCurrency(totalCents)}
          </span>
        </div>
      )}

      {/* Stepper de quantidade */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <button
            type="button"
            onClick={decrement}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "none",
              cursor: quantidade === 1 ? "not-allowed" : "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: quantidade === 1 ? "var(--text-muted)" : "var(--carbon)",
              flexShrink: 0,
            }}
            disabled={quantidade === 1}
          >
            −
          </button>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            minWidth: 24,
            textAlign: "center",
          }}>
            {quantidade}
          </span>
          <button
            type="button"
            onClick={increment}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--carbon)",
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="wc-btn wc-btn-primary"
          style={{ flex: 2 }}
          onClick={handleAdicionar}
        >
          {adicionado
            ? `✓ ${formatCurrency(totalCents)} — Adicionado!`
            : `Adicionar · ${formatCurrency(totalCents)}`}
        </button>
      </div>
    </div>
  );
}
