"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { atualizarStatusPedido } from "./actions";
import { ModalConfirmacaoStatus, STATUSES_COM_CONFIRMACAO, MENSAGEM_CONFIRMACAO } from "@/components/ModalConfirmacaoStatus";

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

type Props = {
  orderId: string;
  statusAtual: string;
  statusLabel: Record<string, string>;
};

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
        <ModalConfirmacaoStatus
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
