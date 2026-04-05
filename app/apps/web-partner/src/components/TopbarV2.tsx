"use client";

import { useState } from "react";

export function TopbarV2() {
  const [lojaAberta, setLojaAberta] = useState(true);

  return (
    <header className="topbar-v2">
      {/* Esquerda: breadcrumb + título */}
      <div className="topbar-left">
        <span className="topbar-breadcrumb">
          Operação /{" "}
          <span className="topbar-breadcrumb-active">Visão Geral</span>
        </span>
        <h1 className="topbar-title">Visão Geral</h1>
      </div>

      {/* Direita: ações */}
      <div className="topbar-right">
        {/* Dúvidas */}
        <button className="topbar-btn" type="button">
          Dúvidas
        </button>

        {/* Toggle Loja Aberta */}
        <button
          className="topbar-toggle"
          type="button"
          onClick={() => setLojaAberta((v) => !v)}
          aria-pressed={lojaAberta}
        >
          <span className="topbar-toggle-label">Loja Aberta</span>
          <div className={`topbar-toggle-pill ${lojaAberta ? "on" : "off"}`}>
            <div className="topbar-toggle-dot" />
          </div>
        </button>

        {/* Minha Conta */}
        <button className="topbar-btn" type="button">
          Minha Conta
        </button>

        {/* Badge IA Ativa */}
        <div className="topbar-badge-ia">
          <div className="topbar-badge-dot" />
          <span className="topbar-badge-ia-text">IA Ativa</span>
        </div>
      </div>
    </header>
  );
}
