"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useCarrinho } from "../context/CarrinhoContext";
import { useTheme } from "../hooks/useTheme";
import { CartSheet } from "./CartSheet";

type Props = {
  nomeLoja: string;
};

// Ícone SVG de lupa (inline, estilo Lucide)
function IconeLupa() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// Ícone SVG de carrinho
function IconeCarrinho() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// Ícone SVG de sol
function IconeSol() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// Ícone SVG de lua
function IconeLua() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Header({ nomeLoja }: Props) {
  const { totalItens } = useCarrinho();
  const [cartOpen, setCartOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [termoBusca, setTermoBusca] = useState(searchParams.get("busca") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce de 300ms: atualiza a URL quando o usuário para de digitar.
  // Só executa na home ("/") para não redirecionar outras páginas.
  useEffect(() => {
    if (pathname !== "/") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (termoBusca.trim()) {
        params.set("busca", termoBusca.trim());
      } else {
        params.delete("busca");
      }
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/");
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termoBusca, pathname]);

  return (
    <>
      <header className="wc-header">
        <a href="/" className="wc-logo" aria-label={nomeLoja}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={nomeLoja}
            className="wc-logo-img"
            style={theme === "dark" ? { filter: "brightness(0) invert(1)" } : undefined}
          />
        </a>

        <div className="wc-search-wrapper">
          <span className="wc-search-icon">
            <IconeLupa />
          </span>
          <input
            type="text"
            className="wc-search-input"
            placeholder="Pesquise produtos"
            aria-label="Pesquisar produtos"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
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
            <span>{theme === "dark" ? <IconeLua /> : <IconeSol />}</span>
            <div className="wc-toggle-track">
              <div className={`wc-toggle-thumb${theme === "dark" ? " dark" : ""}`} />
            </div>
          </button>

          {/* Avatar — link para perfil */}
          <a href="/perfil" className="wc-avatar" title="Minha conta" aria-label="Minha conta">
            V
          </a>

          {/* Carrinho */}
          <button
            onClick={() => setCartOpen(true)}
            className="wc-cart-btn"
            aria-label={`Carrinho com ${totalItens} itens`}
          >
            <IconeCarrinho />
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
