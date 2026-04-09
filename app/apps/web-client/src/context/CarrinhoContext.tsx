"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "vendza_carrinho";

export type CarrinhoItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  imagemUrl: string | null;
  unitPriceCents: number;
  quantity: number;
};

type CarrinhoContextType = {
  items: CarrinhoItem[];
  totalItens: number;
  subtotalCents: number;
  carregando: boolean;
  adicionarItem: (item: Omit<CarrinhoItem, "id" | "quantity"> & { quantity?: number }) => void;
  removerItem: (productId: string) => void;
  atualizarQuantidade: (productId: string, quantity: number) => void;
  limparCarrinho: () => void;
};

const CarrinhoContext = createContext<CarrinhoContextType | null>(null);

function carregarDoLocalStorage(): CarrinhoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CarrinhoItem[]) : [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CarrinhoItem[]>(() => carregarDoLocalStorage());
  // Impede redirect prematuro no SSR: só false após montar no cliente
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const adicionarItem = useCallback(
    (item: Omit<CarrinhoItem, "id" | "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i,
          );
        }
        return [
          ...prev,
          {
            id: `${item.productId}-${Date.now()}`,
            quantity: item.quantity ?? 1,
            ...item,
          },
        ];
      });
    },
    [],
  );

  const removerItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const atualizarQuantidade = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
    }
  }, []);

  const limparCarrinho = useCallback(() => {
    setItems([]);
  }, []);

  const totalItens = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  return (
    <CarrinhoContext.Provider
      value={{
        items,
        totalItens,
        subtotalCents,
        carregando,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho(): CarrinhoContextType {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider");
  return ctx;
}
