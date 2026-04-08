"use client";

import { useEffect, useState } from "react";

const AGE_KEY = "vendza_age_verified";

export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(AGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function confirmar() {
    localStorage.setItem(AGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="wc-agegate-overlay">
      <div
        className="wc-card"
        style={{ maxWidth: 420, width: "100%", textAlign: "center" }}
      >
        <h2 style={{ color: "var(--carbon)", margin: "0 0 12px" }}>
          Você tem 18 anos ou mais?
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Este site vende bebidas alcoólicas exclusivamente para maiores de 18 anos.
          Ao continuar, você declara ter a idade mínima legal.
        </p>
        <div className="wc-actions" style={{ justifyContent: "center" }}>
          <button className="wc-btn wc-btn-primary" onClick={confirmar}>
            Sim, tenho 18 anos ou mais
          </button>
          <a
            className="wc-btn wc-btn-secondary"
            href="https://www.google.com"
          >
            Não
          </a>
        </div>
      </div>
    </div>
  );
}
