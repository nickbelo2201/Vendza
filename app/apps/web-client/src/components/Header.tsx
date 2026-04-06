"use client";

import { useState } from "react";

import { useCarrinho } from "../context/CarrinhoContext";
import { useTheme } from "../hooks/useTheme";
import { CartSheet } from "./CartSheet";

type Props = {
  nomeLoja: string;
};

export function Header({ nomeLoja }: Props) {
  const { totalItens } = useCarrinho();
  const [cartOpen, setCartOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <>
      <header className="wc-header">
        <a href="/" className="wc-logo">
          {nomeLoja}
        </a>

        <div className="wc-search-wrapper">
          <span className="wc-search-icon">🔍</span>
          <input
            type="text"
            className="wc-search-input"
            placeholder="Pesquise sua bebida favorita"
            aria-label="Pesquisar produtos"
          />
        </div>

        <div className="wc-header-actions">
          {/* Toggle dark/light */}
          <button
            onClick={toggle}
            className="wc-theme-toggle"
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            <span>{theme === "dark" ? "☽" : "☀"}</span>
            <div className="wc-toggle-track">
              <div className={`wc-toggle-thumb${theme === "dark" ? " dark" : ""}`} />
            </div>
          </button>

          {/* Seletor de endereço */}
          <button className="wc-address-pill" aria-label="Selecionar endereço de entrega">
            <div>
              <span className="wc-address-label">Receber em</span>
              <span className="wc-address-value">São Paulo, SP</span>
            </div>
            <span>›</span>
          </button>

          {/* Avatar */}
          <div className="wc-avatar" title="Minha conta">
            V
          </div>

          {/* Carrinho */}
          <button
            onClick={() => setCartOpen(true)}
            className="wc-cart-btn"
            aria-label={`Carrinho com ${totalItens} itens`}
          >
            🛒
            {totalItens > 0 && (
              <span className="wc-cart-badge">{totalItens}</span>
            )}
          </button>
        </div>
      </header>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
