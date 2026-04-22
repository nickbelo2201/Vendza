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
  publicId?: string;
  statusAtualLabel?: string;
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
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !carregando) onCancelar(); }}
    >
      <div
        style={{
          background: "var(--v2-surface, rgba(30, 41, 59, 0.95))",
          border: "1px solid var(--v2-border, rgba(255, 255, 255, 0.08))",
          borderRadius: 14,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(12px)",
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
            borderBottom: "1px solid var(--v2-border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isCancelamento ? "rgba(220, 38, 38, 0.15)" : "rgba(45, 90, 61, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isCancelamento ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 14 14"/>
              </svg>
            )}
          </div>
          <h2 style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--v2-text-prim, #F1F5F9)",
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {titulo}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px 20px" }}>
          {publicId && (
            <div style={{
              background: isCancelamento ? "rgba(220, 38, 38, 0.1)" : "rgba(45, 90, 61, 0.15)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              border: `1px solid ${isCancelamento ? "rgba(220, 38, 38, 0.2)" : "rgba(74, 222, 128, 0.15)"}`,
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--v2-text-prim, #F1F5F9)",
                marginBottom: 4,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {publicId}
              </div>
              {statusAtualLabel && statusDestinoLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--v2-text-sec, #94A3B8)" }}>
                  <span>{statusAtualLabel}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span style={{ fontWeight: 600, color: isCancelamento ? "#ef4444" : "#4ADE80" }}>
                    {statusDestinoLabel}
                  </span>
                </div>
              )}
            </div>
          )}

          <p style={{
            fontSize: 13,
            color: "var(--v2-text-sec, #94A3B8)",
            lineHeight: 1.6,
            margin: "0 0 20px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {descricao}
          </p>

          {/* Botões */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onCancelar}
              disabled={carregando}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                background: "transparent",
                border: "1px solid var(--v2-border, rgba(255, 255, 255, 0.12))",
                borderRadius: 8,
                color: "var(--v2-text-sec, #94A3B8)",
                cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.05)"; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "transparent"; }}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={carregando}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: isCancelamento ? "rgba(220, 38, 38, 0.8)" : "var(--v2-green, #2D5A3D)",
                border: "none",
                borderRadius: 8,
                color: "#ffffff",
                cursor: carregando ? "wait" : "pointer",
                opacity: carregando ? 0.7 : 1,
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => {
                if (!carregando) (e.target as HTMLButtonElement).style.background = isCancelamento ? "rgba(220, 38, 38, 1)" : "#24492f";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = isCancelamento ? "rgba(220, 38, 38, 0.8)" : "var(--v2-green, #2D5A3D)";
              }}
            >
              {carregando ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
