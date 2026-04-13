"use client";

import { useEffect, useState } from "react";

const SECOES = [
  { id: "loja", label: "Informações da Loja" },
  { id: "horarios", label: "Horários" },
  { id: "dados-bancarios", label: "Dados Bancários" },
  { id: "zonas", label: "Zonas de Entrega" },
  { id: "usuarios", label: "Usuários" },
];

export function ConfigNavLateral() {
  const [ativa, setAtiva] = useState("loja");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECOES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) setAtiva(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {/* Nav lateral — visível apenas em desktop (>1200px) */}
      <nav
        className="conf-nav-lateral"
        style={{
          position: "sticky",
          top: 24,
          width: 180,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {SECOES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: ativa === id ? 600 : 400,
              color: ativa === id ? "var(--g)" : "var(--text-muted)",
              borderLeft: `2px solid ${ativa === id ? "var(--g)" : "transparent"}`,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Dropdown — visível apenas em tablet/mobile (<1200px via CSS) */}
      <div className="conf-nav-dropdown" style={{ width: "100%" }}>
        <select
          value={ativa}
          onChange={(e) => {
            setAtiva(e.target.value);
            scrollTo(e.target.value);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--carbon)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            appearance: "auto",
          }}
        >
          {SECOES.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
