"use client";

import { useState } from "react";

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
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Dados Bancários</h2>

      {conta?.lastFourDigits && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "var(--green-soft)",
            border: "1px solid #a7d9c8",
            marginBottom: 20,
            fontSize: 13,
            color: "var(--green)",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Chave atual: </span>
          <span style={{ fontFamily: "'Space Grotesk', monospace", letterSpacing: "0.05em" }}>
            ****{conta.lastFourDigits}
          </span>
          {conta.bankName && (
            <span style={{ color: "var(--text-muted)", marginLeft: 12, fontWeight: 400 }}>
              — {conta.bankName}
            </span>
          )}
        </div>
      )}

      <form onSubmit={salvar} className="wp-stack">
        <div className="wp-field">
          <label className="wp-label" htmlFor="keyType">Tipo de chave PIX</label>
          <select
            id="keyType"
            className="wp-input"
            value={keyType}
            onChange={(e) => setKeyType(e.target.value)}
          >
            {TIPOS_CHAVE.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
            placeholder={conta?.lastFourDigits ? "Digite para substituir a chave atual" : "Informe a chave PIX"}
            autoComplete="off"
          />
          <span className="wp-field-hint">
            A chave será armazenada de forma segura. Apenas os últimos 4 dígitos serão exibidos.
          </span>
        </div>

        <div className="wp-field">
          <label className="wp-label" htmlFor="bankName">
            Nome do banco
            <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>(opcional)</span>
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

        {feedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: feedback.ok ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${feedback.ok ? "#bbf7d0" : "#fecaca"}`,
              color: feedback.ok ? "#15803d" : "#dc2626",
            }}
          >
            {feedback.msg}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className="wp-button"
            disabled={salvando}
            style={{ opacity: salvando ? 0.7 : 1, cursor: salvando ? "not-allowed" : "pointer" }}
          >
            {salvando ? "Salvando..." : "Salvar dados bancários"}
          </button>
        </div>
      </form>
    </div>
  );
}
