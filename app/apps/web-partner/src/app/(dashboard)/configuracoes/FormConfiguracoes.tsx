"use client";

import { useTransition } from "react";

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

export function FormConfiguracoes({ settings }: Props) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const minimumCents = Math.round(
      parseFloat(String(data.get("minimumOrderValue") ?? "0")) * 100
    );
    startTransition(() => {
      salvarConfiguracoes({
        name: String(data.get("name")),
        whatsappPhone: String(data.get("whatsappPhone")),
        status: String(data.get("status")) as "open" | "closed" | "paused",
        minimumOrderValueCents: minimumCents,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="wp-stack">
      <div className="wp-field">
        <label htmlFor="name" className="wp-label">Nome da loja</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={settings.name}
          required
          className="wp-input"
        />
      </div>

      <div className="wp-field">
        <label className="wp-label">Slug</label>
        <input
          type="text"
          value={settings.slug}
          readOnly
          className="wp-input"
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
        <label htmlFor="whatsappPhone" className="wp-label">WhatsApp (com DDI)</label>
        <input
          id="whatsappPhone"
          name="whatsappPhone"
          type="text"
          defaultValue={settings.whatsappPhone}
          placeholder="5511999999999"
          className="wp-input"
        />
        <span className="wp-field-hint">Formato: 55 + DDD + número</span>
      </div>

      <div className="wp-field">
        <label htmlFor="status" className="wp-label">Status da loja</label>
        <select
          id="status"
          name="status"
          defaultValue={settings.status}
          className="wp-input"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="wp-field-hint">
          Clientes só conseguem fazer pedidos quando o status é "Aberta".
        </span>
      </div>

      <div className="wp-field">
        <label htmlFor="minimumOrderValue" className="wp-label">Pedido mínimo (R$)</label>
        <input
          id="minimumOrderValue"
          name="minimumOrderValue"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(settings.minimumOrderValueCents / 100).toFixed(2)}
          className="wp-input"
        />
      </div>

      <div>
        <button
          type="submit"
          className="wp-button"
          disabled={pending}
          style={{ opacity: pending ? 0.7 : 1, cursor: pending ? "not-allowed" : "pointer" }}
        >
          {pending ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </form>
  );
}
