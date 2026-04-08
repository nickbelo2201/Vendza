"use client";

import { useState, useRef, useCallback } from "react";

type KanbanItem = {
  id: string;
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

export function KanbanBoard({ initialCols }: Props) {
  const [cols, setCols] = useState<KanbanCol[]>(initialCols);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColLabel, setOverColLabel] = useState<string | null>(null);
  const dragSource = useRef<{ colLabel: string; itemId: string } | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, colLabel: string, itemId: string) => {
      dragSource.current = { colLabel, itemId };
      setDraggingId(itemId);
      e.dataTransfer.effectAllowed = "move";
      // Rotação sutil ao pegar o card
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.transform = "rotate(-2deg)";
        setTimeout(() => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.transform = "";
          }
        }, 0);
      }
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setOverColLabel(null);
    dragSource.current = null;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, colLabel: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverColLabel(colLabel);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Só limpa se saiu do container da coluna (não de um filho)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOverColLabel(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColLabel: string) => {
      e.preventDefault();
      if (!dragSource.current) return;

      const { colLabel: srcColLabel, itemId } = dragSource.current;
      if (srcColLabel === targetColLabel) {
        setOverColLabel(null);
        return;
      }

      setCols((prev) => {
        const next = prev.map((col) => ({ ...col, items: [...col.items] }));
        const srcCol = next.find((c) => c.label === srcColLabel);
        const dstCol = next.find((c) => c.label === targetColLabel);
        if (!srcCol || !dstCol) return prev;

        const idx = srcCol.items.findIndex((i) => i.id === itemId);
        if (idx === -1) return prev;

        const [moved] = srcCol.items.splice(idx, 1) as [KanbanItem];
        dstCol.items.push(moved);
        return next;
      });

      setOverColLabel(null);
    },
    []
  );

  return (
    <div className="kanban-card">
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
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--v2-text-muted)",
                    padding: "12px 0",
                    textAlign: "center",
                  }}
                >
                  Vazio
                </div>
              ) : (
                col.items.map((item) => {
                  const isDragging = draggingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`kanban-item${isDragging ? " kanban-item--dragging" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, col.label, item.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="kanban-item-id">
                        {item.id}: {item.cliente}
                      </span>
                      <span className="kanban-item-sub">{item.tempo}</span>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
