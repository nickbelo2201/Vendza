"use client";

// Status que exigem confirmação antes de mudar
export const STATUSES_COM_CONFIRMACAO = new Set(["out_for_delivery", "delivered", "cancelled"]);

export const MENSAGEM_CONFIRMACAO: Record<string, { titulo: string; descricao: string }> = {
  out_for_delivery: {
    titulo: "Confirmar saída para entrega",
    descricao: "Confirmar que o pedido saiu para entrega?",
  },
  delivered: {
    titulo: "Confirmar entrega",
    descricao: "Confirmar entrega do pedido?",
  },
  cancelled: {
    titulo: "Cancelar pedido",
    descricao: "Tem certeza que deseja cancelar? Esta ação não pode ser desfeita.",
  },
};

type ModalConfirmacaoStatusProps = {
  titulo: string;
  descricao: string;
  /** publicId do pedido (ex: PED-0012) — exibido no modal */
  publicId?: string;
  /** Label do status atual */
  statusAtualLabel?: string;
  /** Label do status destino */
  statusDestinoLabel?: string;
  statusAlvo: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  carregando: boolean;
};

export function ModalConfirmacaoStatus({
  titulo,
  descricao,
  publicId,
  statusAtualLabel,
  statusDestinoLabel,
  statusAlvo,
  onConfirmar,
  onCancelar,
  carregando,
}: ModalConfirmacaoStatusProps) {
  const isCancelamento = statusAlvo === "cancelled";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(10,10,14,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !carregando) onCancelar(); }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(15,23,42,.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isCancelamento ? "#fef2f2" : "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isCancelamento ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 14 14"/>
              </svg>
            )}
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--carbon)", margin: 0 }}>
            {titulo}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px 20px" }}>
          {/* Número do pedido + transição de status */}
          {publicId && (
            <div style={{
              background: isCancelamento ? "#fef2f2" : "#f8fafc",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              border: `1px solid ${isCancelamento ? "#fecaca" : "var(--border)"}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--carbon)", marginBottom: 4 }}>
                {publicId}
              </div>
              {statusAtualLabel && statusDestinoLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>{statusAtualLabel}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span style={{ fontWeight: 600, color: isCancelamento ? "#dc2626" : "var(--g)" }}>
                    {statusDestinoLabel}
                  </span>
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
            {descricao}
          </p>

          {/* Footer */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="wp-btn wp-btn-secondary"
              onClick={onCancelar}
              disabled={carregando}
              style={{ fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={isCancelamento ? "wp-btn wp-btn-danger" : "wp-btn wp-btn-primary"}
              onClick={onConfirmar}
              disabled={carregando}
              style={{ fontSize: 13, opacity: carregando ? 0.7 : 1 }}
            >
              {carregando ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
