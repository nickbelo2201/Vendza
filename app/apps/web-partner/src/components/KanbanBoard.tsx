"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import { moverCardKanban } from "../app/(dashboard)/kanban-actions";
import { PedidoDrawerKanban } from "./PedidoDrawerKanban";

// Mapeamento coluna kanban → status da API
const COL_STATUS: Record<string, string> = {
  "A Fazer": "confirmed",
  "Em Progresso": "preparing",
  "Concluído": "delivered",
};

type KanbanItem = {
  id: string;      // publicId — exibição
  orderId: string; // UUID — chamadas API
  cliente: string;
  tempo: string;
};

type KanbanCol = {
  label: string;
  items: KanbanItem[];
};

type Props = {
  initialCols: KanbanCol[];
};

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

type SelectedItem = { id: string; orderId: string; colLabel: string } | null;

export function KanbanBoard({ initialCols }: Props) {
  const [cols, setCols] = useState<KanbanCol[]>(initialCols);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColLabel, setOverColLabel] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  const dragSource = useRef<{ colLabel: string; itemId: string } | null>(null);
  // Ref sempre atualizada com o estado atual — evita stale closure no handler async
  const colsRef = useRef(cols);
  colsRef.current = cols;

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [toast]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, colLabel: string, itemId: string) => {
      dragSource.current = { colLabel, itemId };
      setDraggingId(itemId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setOverColLabel(null);
    dragSource.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colLabel: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColLabel(colLabel);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOverColLabel(null);
    }
  }, []);

  const handleCardClick = useCallback((item: KanbanItem, colLabel: string) => {
    setSelectedItem({ id: item.id, orderId: item.orderId, colLabel });
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleStatusAvancado = useCallback((novoStatus: string, novaColLabel: string) => {
    if (!selectedItem) return;
    const { id: itemId } = selectedItem;
    setCols((prev) => {
      const next = prev.map((col) => ({ ...col, items: [...col.items] }));
      // Remove o item da coluna atual
      let movedItem: KanbanItem | undefined;
      for (const col of next) {
        const idx = col.items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          [movedItem] = col.items.splice(idx, 1) as [KanbanItem];
          break;
        }
      }
      if (!movedItem) return prev;
      // Insere na nova coluna
      const dst = next.find((c) => c.label === novaColLabel);
      if (!dst) return prev;
      dst.items.push(movedItem);
      return next;
    });
    setSelectedItem((prev) => prev ? { ...prev, colLabel: novaColLabel } : null);
  }, [selectedItem]);

  const handleCancelado = useCallback(() => {
    if (!selectedItem) return;
    const { id: itemId } = selectedItem;
    setCols((prev) =>
      prev.map((col) => ({ ...col, items: col.items.filter((i) => i.id !== itemId) }))
    );
  }, [selectedItem]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetColLabel: string) => {
    e.preventDefault();
    if (!dragSource.current) return;

    const { colLabel: srcColLabel, itemId } = dragSource.current;
    setOverColLabel(null);
    if (srcColLabel === targetColLabel) return;

    // Snapshot do estado atual para rollback (lê via ref — sempre fresco)
    const snapshot = colsRef.current;
    const srcCol = snapshot.find((c) => c.label === srcColLabel);
    const item = srcCol?.items.find((i) => i.id === itemId);
    if (!item) return;

    // Atualização otimista imediata
    setCols((prev) => {
      const next = prev.map((col) => ({ ...col, items: [...col.items] }));
      const src = next.find((c) => c.label === srcColLabel);
      const dst = next.find((c) => c.label === targetColLabel);
      if (!src || !dst) return prev;
      const idx = src.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      const [moved] = src.items.splice(idx, 1) as [KanbanItem];
      dst.items.push(moved);
      return next;
    });

    const newStatus = COL_STATUS[targetColLabel];
    if (!newStatus) return;

    setLoadingId(itemId);
    try {
      await moverCardKanban(item.orderId, newStatus);
    } catch {
      // Reverte para o estado anterior ao drag
      setCols(snapshot);
      setToast(`Não foi possível mover o pedido ${item.id}. Tente novamente.`);
    } finally {
      setLoadingId(null);
    }
  }, []);

  return (
    <div className="kanban-card" style={{ position: "relative" }}>
      <div className="kanban-header">Pedidos em Andamento</div>
      <div className="kanban-grid">
        {cols.map((col) => {
          const isOver = overColLabel === col.label;
          return (
            <div
              key={col.label}
              className={`kanban-col${isOver ? " kanban-col--over" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.label)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.label)}
            >
              <div className="kanban-col-label">{col.label}</div>
              {col.items.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--v2-text-muted)", padding: "12px 0", textAlign: "center" }}>
                  Vazio
                </div>
              ) : (
                col.items.map((item) => {
                  const isDragging = draggingId === item.id;
                  const isLoading = loadingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`kanban-item kanban-item--clickable${isDragging ? " kanban-item--dragging" : ""}`}
                      draggable={!isLoading}
                      onDragStart={(e) => handleDragStart(e, col.label, item.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !isLoading && !isDragging && handleCardClick(item, col.label)}
                      style={{
                        opacity: isLoading ? 0.5 : isDragging ? 0.6 : 1,
                        cursor: isLoading ? "wait" : "pointer",
                        transition: "opacity 0.15s",
                      }}
                    >
                      <span className="kanban-item-id">{item.id}: {item.cliente}</span>
                      <span className="kanban-item-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {item.tempo}
                        {isLoading && (
                          <span
                            aria-label="Salvando..."
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              border: "2px solid currentColor",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "kanban-spin 0.7s linear infinite",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Toast de erro — aparece na base do kanban */}
      {toast && (
        <div
          role="alert"
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#DC2626",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 50,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IconWarning />
          {toast}
          <button
            onClick={() => setToast(null)}
            aria-label="Fechar notificação"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: 0,
              marginLeft: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconX />
          </button>
        </div>
      )}

      <style>{`
        @keyframes kanban-spin { to { transform: rotate(360deg); } }
        .kanban-item--clickable:hover {
          border-color: var(--g) !important;
          box-shadow: 0 2px 8px rgba(45,106,79,.15);
        }
      `}</style>

      {/* Drawer de resumo do pedido */}
      <PedidoDrawerKanban
        orderId={selectedItem?.orderId ?? null}
        colLabel={selectedItem?.colLabel ?? null}
        onClose={handleDrawerClose}
        onStatusAvancado={handleStatusAvancado}
        onCancelado={handleCancelado}
      />
    </div>
  );
}
