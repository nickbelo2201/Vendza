"use client";

import { useEffect, useState } from "react";

import { salvarDadosBancarios } from "./actions";

type ContaBancaria = {
  keyType: string;
  lastFourDigits: string | null;
  bankName: string | null;
};

type Props = {
  conta: ContaBancaria | null;
};

const TIPOS_CHAVE = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "random", label: "Chave aleatória" },
];

export function DadosBancarios({ conta }: Props) {
  const [keyType, setKeyType] = useState(conta?.keyType ?? "cpf");
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState(conta?.bankName ?? "");
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Auto-dismiss do toast após 3s
  useEffect(() => {
    if (feedback?.ok) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!pixKey.trim()) {
      setFeedback({ ok: false, msg: "Informe a chave PIX." });
      return;
    }
    setSalvando(true);
    setFeedback(null);
    try {
      await salvarDadosBancarios({ keyType, pixKey, bankName: bankName.trim() || null });
      setFeedback({ ok: true, msg: "Dados bancários salvos com sucesso." });
      setPixKey("");
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : "Erro ao salvar dados bancários.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="wp-panel">
      {/* Header com badge de status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Dados Bancários</h2>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: conta?.lastFourDigits ? "#dcfce7" : "#fef9c3",
            color: conta?.lastFourDigits ? "#15803d" : "#a16207",
            border: `1px solid ${conta?.lastFourDigits ? "#bbf7d0" : "#fef08a"}`,
          }}
        >
          {conta?.lastFourDigits ? "Conta válida cadastrada" : "Pendente"}
        </span>
      </div>

      <form onSubmit={salvar}>
        <div
          className="conf-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* Coluna esquerda: formulário */}
          <div className="wp-stack">
            <div className="wp-field">
              <label className="wp-label" htmlFor="keyType">
                Tipo de chave PIX
              </label>
              <select
                id="keyType"
                className="wp-input"
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
              >
                {TIPOS_CHAVE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="wp-field">
              <label className="wp-label" htmlFor="pixKey">
                {conta?.lastFourDigits ? "Nova chave PIX" : "Chave PIX"}
              </label>
              <input
                id="pixKey"
                className="wp-input"
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={
                  conta?.lastFourDigits
                    ? "Digite para substituir a chave atual"
                    : "Informe a chave PIX"
                }
                autoComplete="off"
              />
              <span className="wp-field-hint">
                A chave será armazenada de forma segura. Apenas os últimos 4 dígitos serão exibidos.
              </span>
            </div>

            <div className="wp-field">
              <label className="wp-label" htmlFor="bankName">
                Nome do banco
                <span
                  style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: 6,
                  }}
                >
                  (opcional)
                </span>
              </label>
              <input
                id="bankName"
                className="wp-input"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ex: Nubank, Itaú, Bradesco..."
              />
            </div>
          </div>

          {/* Coluna direita: chave atual (se existir) */}
          <div>
            {conta?.lastFourDigits ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  background: "var(--green-soft)",
                  border: "1px solid #a7d9c8",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Chave atual
                </p>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--green)",
                    letterSpacing: "0.1em",
                  }}
                >
                  ****{conta.lastFourDigits}
                </p>
                {conta.bankName && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{conta.bankName}</p>
                )}
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Para atualizar, preencha o formulário ao lado.
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  background: "var(--cream)",
                  border: "1px dashed var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 140,
                  textAlign: "center",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Nenhuma chave PIX cadastrada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback inline — apenas erros */}
        {feedback && !feedback.ok && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              marginTop: 16,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
            }}
          >
            {feedback.msg}
          </div>
        )}

        <div
          className="conf-btn-save"
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 20,
            marginTop: 24,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="submit"
            className="wp-btn wp-btn-primary"
            disabled={salvando}
            style={{ opacity: salvando ? 0.7 : 1, cursor: salvando ? "not-allowed" : "pointer" }}
          >
            {salvando ? "Salvando..." : "Salvar dados bancários"}
          </button>
        </div>
      </form>

      {/* Toast de sucesso */}
      {feedback?.ok && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 500,
            background: "var(--green)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "slide-in-right 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
