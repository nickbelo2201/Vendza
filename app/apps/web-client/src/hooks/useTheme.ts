"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  // Valor inicial consistente entre servidor e cliente — evita hydration mismatch.
  // Preferência salva é lida no useEffect (somente client-side, após mount).
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("vendza-theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vendza-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
