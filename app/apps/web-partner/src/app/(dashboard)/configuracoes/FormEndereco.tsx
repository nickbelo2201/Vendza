"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";

import { salvarEndereco } from "./actions";

type EnderecoProps = {
  address: {
    addressStreet: string | null;
    addressNeighborhood: string | null;
    addressCity: string | null;
    addressState: string | null;
    addressZipCode: string | null;
    addressComplement: string | null;
  };
};

function formatarCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function FormEndereco({ address }: EnderecoProps) {
  const [pending, startTransition] = useTransition();
  const [cepDisplay, setCepDisplay] = useState(
    address.addressZipCode ? formatarCep(address.addressZipCode) : ""
  );

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    setCepDisplay(raw ? formatarCep(raw) : "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await salvarEndereco({
          addressStreet: String(data.get("addressStreet") ?? "").trim() || null,
          addressNeighborhood: String(data.get("addressNeighborhood") ?? "").trim() || null,
          addressCity: String(data.get("addressCity") ?? "").trim() || null,
          addressState: String(data.get("addressState") ?? "").trim() || null,
          addressZipCode: cepDisplay.replace(/\D/g, "") || null,
          addressComplement: String(data.get("addressComplement") ?? "").trim() || null,
        });
        toast.success("Endereço salvo com sucesso");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar endereço.");
      }
    });
  }

  return (
    <div className="wp-panel">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Endereço da Loja</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Utilizado para centralizar o mapa de zonas de entrega e exibir o endereço nos documentos da loja.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
          className="conf-2col"
        >
          {/* Coluna esquerda */}
          <div className="wp-stack">
            <div className="wp-field">
              <label htmlFor="addressZipCode" className="wp-label">CEP</label>
              <input
                id="addressZipCode"
                name="addressZipCode"
                type="text"
                value={cepDisplay}
                onChange={handleCepChange}
                placeholder="00000-000"
                inputMode="numeric"
                className="wp-input conf-input"
                style={{ maxWidth: 160 }}
              />
            </div>

            <div className="wp-field">
              <label htmlFor="addressStreet" className="wp-label">Rua / Logradouro</label>
              <input
                id="addressStreet"
                name="addressStreet"
                type="text"
                defaultValue={address.addressStreet ?? ""}
                placeholder="Ex: Rua das Flores, 123"
                className="wp-input conf-input"
              />
            </div>

            <div className="wp-field">
              <label htmlFor="addressComplement" className="wp-label">Complemento</label>
              <input
                id="addressComplement"
                name="addressComplement"
                type="text"
                defaultValue={address.addressComplement ?? ""}
                placeholder="Sala 2, Loja A..."
                className="wp-input conf-input"
              />
            </div>
          </div>

          {/* Coluna direita */}
          <div className="wp-stack">
            <div className="wp-field">
              <label htmlFor="addressNeighborhood" className="wp-label">Bairro</label>
              <input
                id="addressNeighborhood"
                name="addressNeighborhood"
                type="text"
                defaultValue={address.addressNeighborhood ?? ""}
                placeholder="Ex: Centro"
                className="wp-input conf-input"
              />
            </div>

            <div className="wp-field">
              <label htmlFor="addressCity" className="wp-label">Cidade</label>
              <input
                id="addressCity"
                name="addressCity"
                type="text"
                defaultValue={address.addressCity ?? ""}
                placeholder="Ex: São Paulo"
                className="wp-input conf-input"
              />
            </div>

            <div className="wp-field">
              <label htmlFor="addressState" className="wp-label">Estado (UF)</label>
              <input
                id="addressState"
                name="addressState"
                type="text"
                defaultValue={address.addressState ?? ""}
                placeholder="Ex: SP"
                maxLength={2}
                className="wp-input conf-input"
                style={{ maxWidth: 100, textTransform: "uppercase" }}
              />
            </div>
          </div>
        </div>

        <div
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
            {pending ? "Salvando..." : "Salvar endereço"}
          </button>
        </div>
      </form>
    </div>
  );
}
