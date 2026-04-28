"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { calcularPrecoComFardo } from "@vendza/utils";
import type { BundlePublico } from "@vendza/types";
import { encryptData, decryptData, looksEncrypted } from "@/lib/crypto";

const STORAGE_KEY = "vendza_carrinho";

export type CarrinhoItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  imagemUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  bundles?: BundlePublico[];
};

/** Retorna o bundle ativo de menor tamanho que se aplica à quantidade. */
export function melhorBundleParaQtd(
  bundles: BundlePublico[] | undefined,
  quantidade: number,
): BundlePublico | null {
  if (!bundles || bundles.length === 0) return null;
  const ativos = bundles
    .filter((b) => b.isAvailable && b.quantity >= 1)
    .sort((a, b) => a.quantity - b.quantity);
  return ativos.find((b) => quantidade >= b.quantity) ?? null;
}

/** Calcula o total real de um item considerando desconto de fardo. */
export function calcularTotalItem(item: CarrinhoItem): number {
  const bundle = melhorBundleParaQtd(item.bundles, item.quantity);
  if (!bundle) return item.unitPriceCents * item.quantity;
  return calcularPrecoComFardo({
    quantidade: item.quantity,
    precoAvulsoCents: item.unitPriceCents,
    bundlePriceCents: bundle.bundlePriceCents,
    quantidadeFardo: bundle.quantity,
  }).totalCents;
}

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

async function carregarDoLocalStorage(): Promise<CarrinhoItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    // Se parece criptografado, descriptografa
    if (looksEncrypted(raw)) {
      try {
        return (await decryptData<CarrinhoItem[]>(raw)) ?? [];
      } catch (error) {
        console.error("Erro ao descriptografar carrinho, usando fallback:", error);
        return [];
      }
    }

    // Caso contrário, trata como JSON puro (compatibilidade com dados antigos)
    return (JSON.parse(raw) as CarrinhoItem[]) ?? [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CarrinhoItem[]>([]);
  // Impede redirect prematuro no SSR: só false após montar no cliente
  const [carregando, setCarregando] = useState(true);

  // Carrega itens ao montar o componente
  useEffect(() => {
    let isMounted = true;
    carregarDoLocalStorage().then((itemsCarregados) => {
      if (isMounted) {
        setItems(itemsCarregados);
        setCarregando(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Salva itens quando há mudança
  useEffect(() => {
    if (!carregando) {
      salvarCarrinhoNoStorage(items);
    }
  }, [items, carregando]);

  // Função auxiliar para salvar com criptografia
  async function salvarCarrinhoNoStorage(carrinho: CarrinhoItem[]): Promise<void> {
    try {
      const encrypted = await encryptData(carrinho);
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error("Erro ao criptografar carrinho:", error);
      // Fallback: salvar como JSON puro
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carrinho));
      } catch {
        // localStorage cheio ou desabilitado — silenciar
      }
    }
  }

  const adicionarItem = useCallback(
    (item: Omit<CarrinhoItem, "id" | "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1), bundles: item.bundles ?? i.bundles }
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
  const subtotalCents = items.reduce((sum, i) => sum + calcularTotalItem(i), 0);

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
