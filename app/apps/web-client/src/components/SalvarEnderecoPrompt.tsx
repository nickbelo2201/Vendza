"use client";

import { useEffect, useState } from "react";
import { useEnderecos } from "../hooks/useEnderecos";

type Props = {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

/**
 * Prompt discreto exibido na página de acompanhamento do pedido,
 * logo após a confirmação, oferecendo salvar o endereço para compras futuras.
 * Aparece apenas uma vez por pedido (controlado via sessionStorage).
 */
export function SalvarEnderecoPrompt({ logradouro, numero, complemento, bairro, cidade, estado, cep }: Props) {
  const { enderecos, salvar } = useEnderecos();
  const [visivel, setVisivel] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [carregandoHook, setCarregandoHook] = useState(true);

  // Aguarda hidratação do hook antes de decidir se exibe o prompt
  useEffect(() => {
    setCarregandoHook(false);
  }, []);

  useEffect(() => {
    if (carregandoHook) return;
    if (!logradouro || !bairro) return;

    // Verifica se já foi dispensado nesta sessão
    const chaveSessionDismissed = `vendza-prompt-endereco-dispensado`;
    if (sessionStorage.getItem(chaveSessionDismissed)) return;

    // Verifica se endereço idêntico já está salvo
    const jaExiste = enderecos.some(
      (e) =>
        e.logradouro.toLowerCase() === logradouro.toLowerCase() &&
        e.numero === numero &&
        e.bairro.toLowerCase() === bairro.toLowerCase()
    );
    if (jaExiste) return;

    setVisivel(true);
  }, [carregandoHook, enderecos, logradouro, numero, bairro]);

  function handleSalvar() {
    salvar({
      label: "Outro",
      logradouro,
      numero,
      complemento: complemento || undefined,
      bairro,
      cidade,
      estado,
      cep,
    });
    setSalvo(true);
    setVisivel(false);
  }

  function handleDispensarr() {
    sessionStorage.setItem(`vendza-prompt-endereco-dispensado`, "1");
    setVisivel(false);
  }

  if (!visivel && !salvo) return null;

  if (salvo) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(45, 90, 61, 0.08)",
          border: "1px solid rgba(45, 90, 61, 0.2)",
          fontSize: 13,
          color: "var(--green)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Endereço salvo para próximas compras.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 8,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span style={{ fontSize: 13, color: "var(--carbon)" }}>
          Salvar este endereço para próximas compras?
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleSalvar}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid var(--green)",
            background: "var(--green)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={handleDispensarr}
          style={{
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          Não, obrigado
        </button>
      </div>
    </div>
  );
}
