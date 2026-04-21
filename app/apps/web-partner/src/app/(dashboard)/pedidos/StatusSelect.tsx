"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { atualizarStatusPedido } from "./actions";

const STATUS_CLASS: Record<string, string> = {
  pending:            "wp-status wp-status-pending",
  confirmed:          "wp-status wp-status-confirmed",
  preparing:          "wp-status wp-status-preparing",
  ready_for_delivery: "wp-status wp-status-ready",
  out_for_delivery:   "wp-status wp-status-out_delivery",
  delivered:          "wp-status wp-status-delivered",
  cancelled:          "wp-status wp-status-cancelled",
};

const ALL_STATUSES = [
  "pending","confirmed","preparing",
  "ready_for_delivery","out_for_delivery","delivered","cancelled",
];

// Status que exigem confirmação antes de mudar
const STATUSES_COM_CONFIRMACAO = new Set(["out_for_delivery", "delivered", "cancelled"]);

const MENSAGEM_CONFIRMACAO: Record<string, { titulo: string; descricao: string }> = {
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

type Props = {
  orderId: string;
  statusAtual: string;
  statusLabel: Record<string, string>;
};

type ModalConfirmacaoProps = {
  titulo: string;
  descricao: string;
  statusAlvo: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  carregando: boolean;
};

function ModalConfirmacao({
  titulo,
  descricao,
  statusAlvo,
  onConfirmar,
  onCancelar,
  carregando,
}: ModalConfirmacaoProps) {
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

export function StatusSelect({ orderId, statusAtual, statusLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  function executarMudanca(novoStatus: string) {
    startTransition(async () => {
      try {
        await atualizarStatusPedido(orderId, novoStatus);
        toast.success("Status atualizado");
      } catch {
        toast.error("Falha ao atualizar status. Tente novamente.");
      } finally {
        setPendingStatus(null);
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value;
    if (novo === statusAtual) return;

    if (STATUSES_COM_CONFIRMACAO.has(novo)) {
      setPendingStatus(novo);
    } else {
      executarMudanca(novo);
    }
  }

  function handleConfirmar() {
    if (!pendingStatus) return;
    setConfirmando(true);
    startTransition(async () => {
      try {
        await atualizarStatusPedido(orderId, pendingStatus);
        toast.success("Status atualizado");
      } catch {
        toast.error("Falha ao atualizar status. Tente novamente.");
      } finally {
        setPendingStatus(null);
        setConfirmando(false);
      }
    });
  }

  function handleCancelarModal() {
    setPendingStatus(null);
    setConfirmando(false);
  }

  const modalInfo = pendingStatus ? MENSAGEM_CONFIRMACAO[pendingStatus] : null;

  return (
    <>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <span className={STATUS_CLASS[statusAtual] ?? "wp-status"} style={{ paddingRight: 28 }}>
            {pending ? "Salvando..." : (statusLabel[statusAtual] ?? statusAtual)}
          </span>
          <svg
            style={{ position: "absolute", right: 8, pointerEvents: "none", opacity: 0.6 }}
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <select
            value={statusAtual}
            onChange={handleChange}
            disabled={pending}
            style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" }}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      {pendingStatus && modalInfo && (
        <ModalConfirmacao
          titulo={modalInfo.titulo}
          descricao={modalInfo.descricao}
          statusAlvo={pendingStatus}
          onConfirmar={handleConfirmar}
          onCancelar={handleCancelarModal}
          carregando={confirmando}
        />
      )}
    </>
  );
}
