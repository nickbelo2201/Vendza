"use client";

import { formatCurrency } from "@vendza/utils";

import { useCarrinho } from "../context/CarrinhoContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartSheet({ open, onClose }: Props) {
  const { items, subtotalCents, removerItem, atualizarQuantidade } = useCarrinho();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="wc-cart-overlay"
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px, 100vw)",
          background: "var(--surface)",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.16)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          gap: 16,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: "var(--carbon)" }}>Carrinho</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "var(--text-muted)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>
            Seu carrinho está vazio.
          </p>
        ) : (
          <>
            <div className="wc-stack" style={{ flex: 1 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    paddingBottom: 12,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--carbon)" }}>
                      {item.name}
                    </p>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                      {formatCurrency(item.unitPriceCents)} / un
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => atualizarQuantidade(item.productId, item.quantity - 1)}
                      style={{
                        width: 28,
                        height: 28,
                        border: "1px solid var(--border)",
                        borderRadius: "50%",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, minWidth: 20, textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => atualizarQuantidade(item.productId, item.quantity + 1)}
                      style={{
                        width: 28,
                        height: 28,
                        border: "1px solid var(--border)",
                        borderRadius: "50%",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--green)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatCurrency(item.unitPriceCents * item.quantity)}
                  </p>
                  <button
                    onClick={() => removerItem(item.productId)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "2px solid var(--border)",
                paddingTop: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatCurrency(subtotalCents)}
                </span>
              </div>
              <a
                href="/checkout"
                className="wc-btn wc-btn-primary"
                style={{ display: "block", textAlign: "center", width: "100%" }}
                onClick={onClose}
              >
                Ir para checkout
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
