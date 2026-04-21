"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { salvarConfiguracoes } from "./actions";

type Props = {
  settings: {
    name: string;
    slug: string;
    whatsappPhone: string;
    status: string;
    minimumOrderValueCents: number;
  };
};

const STATUS_OPTIONS = [
  { value: "open", label: "Aberta" },
  { value: "closed", label: "Fechada" },
  { value: "paused", label: "Pausada" },
];

function formatWhatsapp(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 2) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
  if (digits.length <= 9)
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
}

export function FormConfiguracoes({ settings }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Máscara WhatsApp
  const [whatsappRaw, setWhatsappRaw] = useState(
    settings.whatsappPhone.replace(/\D/g, "")
  );
  const [whatsappDisplay, setWhatsappDisplay] = useState(() => {
    const v = settings.whatsappPhone;
    return v ? formatWhatsapp(v) : "";
  });

  const statusAtual = settings.status;

  // Auto-dismiss do toast após 3s
  useEffect(() => {
    if (feedback?.ok) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Aviso de alterações não salvas ao sair da página
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  function validarCampo(campo: string, valor: string) {
    if (!valor.trim()) {
      setErros((prev) => ({ ...prev, [campo]: "Campo obrigatório" }));
    } else {
      setErros((prev) => {
        const p = { ...prev };
        delete p[campo];
        return p;
      });
    }
  }

  function handleWhatsappChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    setWhatsappRaw(raw);
    setWhatsappDisplay(raw ? formatWhatsapp(raw) : "");
    setHasChanges(true);
    setFeedback(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const nameVal = String(data.get("name") ?? "").trim();
    const newErros: Record<string, string> = {};
    if (!nameVal) newErros.name = "Campo obrigatório";
    if (!whatsappRaw.trim()) newErros.whatsappPhone = "Campo obrigatório";

    if (Object.keys(newErros).length > 0) {
      setErros(newErros);
      return;
    }

    const minimumCents = Math.round(
      parseFloat(String(data.get("minimumOrderValue") ?? "0")) * 100
    );
    startTransition(async () => {
      try {
        await salvarConfiguracoes({
          name: nameVal,
          whatsappPhone: whatsappRaw,
          status: String(data.get("status")) as "open" | "closed" | "paused",
          minimumOrderValueCents: minimumCents,
        });
        setFeedback({ ok: true, msg: "Configurações salvas com sucesso." });
        toast.success("Dados salvos com sucesso");
        setHasChanges(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar configurações.";
        setFeedback({ ok: false, msg });
        toast.error(msg);
      }
    });
  }

  return (
    <div className="wp-panel">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Informações da Loja</h2>
      </div>

      <form onSubmit={handleSubmit} onChange={() => setHasChanges(true)}>
        <div
          className="conf-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* Coluna esquerda */}
          <div className="wp-stack">
            <div className="wp-field">
              <label htmlFor="name" className="wp-label">
                Nome da loja
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={settings.name}
                required
                className="wp-input conf-input"
                onBlur={(e) => validarCampo("name", e.target.value)}
                style={{ borderColor: erros.name ? "#ef4444" : undefined }}
              />
              {erros.name && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  {erros.name}
                </span>
              )}
            </div>

            <div className="wp-field">
              <label
                className="wp-label"
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                Slug
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </label>
              <input
                type="text"
                value={settings.slug}
                readOnly
                className="wp-input conf-input"
                style={{
                  background: "var(--cream)",
                  color: "var(--text-muted)",
                  cursor: "not-allowed",
                  fontFamily: "'Space Grotesk', monospace",
                }}
              />
              <span className="wp-field-hint">
                O slug é o identificador público da loja na URL e não pode ser alterado aqui.
              </span>
            </div>

            <div className="wp-field">
              <label htmlFor="whatsappDisplay" className="wp-label">
                WhatsApp (com DDI)
              </label>
              {/* Input hidden com valor raw para envio */}
              <input type="hidden" name="whatsappPhone" value={whatsappRaw} />
              {/* Input de display com máscara */}
              <input
                id="whatsappDisplay"
                type="text"
                value={whatsappDisplay}
                onChange={handleWhatsappChange}
                onBlur={() => validarCampo("whatsappPhone", whatsappRaw)}
                placeholder="+55 (11) 99999-9999"
                className="wp-input conf-input"
                inputMode="tel"
                style={{
                  borderColor: erros.whatsappPhone ? "#ef4444" : undefined,
                }}
              />
              {erros.whatsappPhone ? (
                <span
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  {erros.whatsappPhone}
                </span>
              ) : (
                <span className="wp-field-hint">Formato: 55 + DDD + número</span>
              )}
            </div>

            <div className="wp-field">
              <label htmlFor="minimumOrderValue" className="wp-label">
                Pedido mínimo (R$)
              </label>
              <input
                id="minimumOrderValue"
                name="minimumOrderValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(settings.minimumOrderValueCents / 100).toFixed(2)}
                className="wp-input conf-input"
              />
            </div>
          </div>

          {/* Coluna direita */}
          <div className="wp-stack">
            <div className="wp-field">
              <label htmlFor="status" className="wp-label">
                Status da loja
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: statusAtual === "open" ? "#22c55e" : "#ef4444",
                  }}
                />
                <select
                  id="status"
                  name="status"
                  defaultValue={settings.status}
                  className="wp-input conf-input"
                  style={{ flex: 1 }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="wp-field-hint">
                Clientes só conseguem fazer pedidos quando o status é &quot;Aberta&quot;.
              </span>
            </div>

            <div className="wp-field">
              <label className="wp-label">Logo da loja</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "var(--cream)",
                    border: "2px dashed var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <button
                  type="button"
                  className="wp-btn wp-btn-secondary"
                  style={{ fontSize: 12 }}
                >
                  Enviar logo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback inline (erros) */}
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

        {/* Footer */}
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
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1, cursor: pending ? "not-allowed" : "pointer" }}
          >
            {pending ? "Salvando..." : "Salvar configurações"}
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
