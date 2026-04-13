"use client";

import { useEffect } from "react";

/**
 * Aciona window.print() automaticamente após a página carregar.
 * Deve ser renderizado como filho de um Server Component.
 */
export function ImprimirAuto() {
  useEffect(() => {
    // Pequeno delay para garantir que a página está totalmente renderizada
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
