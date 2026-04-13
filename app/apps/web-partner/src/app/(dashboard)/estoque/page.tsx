"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../../../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function fetchComAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ItemEstoque = {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  safetyStock: number;
  status: "ok" | "atencao" | "critico";
  giro: number;
  curvaABC: "A" | "B" | "C";
};

type MovimentoHistorico = {
  id: string;
  type: string;
  quantityDelta: number;
  reason: string;
  createdAt: string;
};

type TipoMovimento = "replenishment" | "manual_adjustment" | "cancellation";
type FiltroEstoque = "todos" | "critico" | "zerado" | "normal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  replenishment: "Entrada",
  manual_adjustment: "Ajuste",
  cancellation: "Saída",
  sale: "Venda",
};

const CURVA_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#dcfce7", text: "#166534" },
  B: { bg: "#dbeafe", text: "#1e40af" },
  C: { bg: "#f3f4f6", text: "#374151" },
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function dataHoraAgora(): string {
  return new Date().toISOString().slice(0, 16);
}

// ─── Ícone de alerta ──────────────────────────────────────────────────────────

function IconeAlerta({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconeFechar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconeHistorico({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

// ─── Badge Curva ABC ──────────────────────────────────────────────────────────

function BadgeCurva({ curva }: { curva: "A" | "B" | "C" }) {
  const cor = CURVA_COLORS[curva] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: cor.bg, color: cor.text,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 12, fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
      minWidth: 28,
    }}>
      {curva}
    </span>
  );
}

// ─── Ponto de status ─────────────────────────────────────────────────────────

function PontoStatus({ status }: { status: "ok" | "atencao" | "critico" }) {
  const cores: Record<string, string> = {
    ok: "#16a34a",
    atencao: "#d97706",
    critico: "#dc2626",
  };
  const labels: Record<string, string> = {
    ok: "Normal",
    atencao: "Atenção",
    critico: "Crítico",
  };
  const cor = cores[status] ?? "#94a3b8";
  const label = labels[status] ?? status;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: cor, flexShrink: 0,
        boxShadow: `0 0 0 2px ${cor}33`,
      }} />
      <span style={{ fontSize: 13, color: cor, fontWeight: 600 }}>{label}</span>
    </span>
  );
}

// ─── Drawer de histórico ──────────────────────────────────────────────────────

type DrawerHistoricoProps = {
  produto: ItemEstoque | null;
  onClose: () => void;
};

function DrawerHistorico({ produto, onClose }: DrawerHistoricoProps) {
  const [historico, setHistorico] = useState<MovimentoHistorico[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!produto) {
      setHistorico([]);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setHistorico([]);

    (async () => {
      try {
        const resposta = await fetchComAuth<{ data: MovimentoHistorico[]; total: number; page: number; pageSize: number }>(
          `/partner/estoque/${produto.productId}/historico?page=1&pageSize=20`
        );
        if (!cancelado) setHistorico(resposta.data);
      } catch (err) {
        if (!cancelado) {
          setErro(err instanceof Error ? err.message : "Erro ao carregar histórico.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => { cancelado = true; };
  }, [produto]);

  useEffect(() => {
    if (!produto) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [produto, onClose]);

  if (!produto) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(10,10,14,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 401,
        width: "min(420px, 100vw)",
        background: "var(--surface)",
        boxShadow: "-8px 0 40px rgba(15,23,42,.18)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--night)" }}>
              {produto.productName}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Histórico de movimentações
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 6, borderRadius: 8,
              display: "flex", alignItems: "center",
            }}
          >
            <IconeFechar size={18} />
          </button>
        </div>

        {/* Resumo do item */}
        <div style={{
          padding: "14px 24px", borderBottom: "1px solid var(--s6)",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
          flexShrink: 0,
        }}>
          {[
            { label: "Estoque atual", valor: String(produto.currentStock) },
            { label: "Estoque mínimo", valor: String(produto.safetyStock) },
            { label: "Curva ABC", valor: produto.curvaABC },
          ].map((m) => (
            <div key={m.label} style={{
              background: "var(--s8)", borderRadius: 8,
              border: "1px solid var(--s6)", padding: "8px 10px",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--night)" }}>
                {m.valor}
              </div>
            </div>
          ))}
        </div>

        {/* Corpo — timeline */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {carregando && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
              Carregando histórico...
            </div>
          )}

          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626",
            }}>
              {erro}
            </div>
          )}

          {!carregando && !erro && historico.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Nenhuma movimentação registrada.
            </div>
          )}

          {historico.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {historico.map((mov, idx) => {
                const entrada = mov.quantityDelta > 0;
                const cor = entrada ? "#16a34a" : "#dc2626";
                const bgCor = entrada ? "#f0fdf4" : "#fef2f2";
                const ultimo = idx === historico.length - 1;

                return (
                  <div key={mov.id} style={{ display: "flex", gap: 12, paddingBottom: ultimo ? 0 : 20, position: "relative" }}>
                    {/* Linha vertical */}
                    {!ultimo && (
                      <div style={{
                        position: "absolute", left: 15, top: 30, bottom: 0,
                        width: 1, background: "var(--s6)",
                      }} />
                    )}

                    {/* Ícone */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: bgCor, border: `2px solid ${cor}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2.5">
                        {entrada
                          ? <polyline points="18 15 12 9 6 15"/>
                          : <polyline points="6 9 12 15 18 9"/>
                        }
                      </svg>
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--night)" }}>
                          {TIPO_LABEL[mov.type] ?? mov.type}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          fontFamily: "'Space Grotesk', sans-serif",
                          color: cor,
                        }}>
                          {entrada ? "+" : ""}{mov.quantityDelta}
                        </span>
                      </div>
                      {mov.reason && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
                          {mov.reason}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {formatarDataHora(mov.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Modal de movimentação ────────────────────────────────────────────────────

type ModalMovimentacaoProps = {
  itens: ItemEstoque[];
  onClose: () => void;
  onSucesso: () => void;
};

function ModalMovimentacao({ itens, onClose, onSucesso }: ModalMovimentacaoProps) {
  const [produtoModal, setProdutoModal] = useState<string>(itens[0]?.productId ?? "");
  const [tipoModal, setTipoModal] = useState<TipoMovimento>("replenishment");
  const [quantidadeModal, setQuantidadeModal] = useState<number>(1);
  const [motivoModal, setMotivoModal] = useState<string>("");
  const [dataHoraModal, setDataHoraModal] = useState<string>(dataHoraAgora());
  const [salvandoModal, setSalvandoModal] = useState<boolean>(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const motivoObrigatorio = tipoModal === "manual_adjustment" || tipoModal === "cancellation";

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSalvar() {
    if (!produtoModal) { setErroModal("Selecione um produto."); return; }
    if (quantidadeModal < 1) { setErroModal("Quantidade deve ser no mínimo 1."); return; }
    if (motivoObrigatorio && !motivoModal.trim()) {
      setErroModal("Informe o motivo para este tipo de movimentação.");
      return;
    }

    setSalvandoModal(true);
    setErroModal(null);

    try {
      await fetchComAuth("/partner/estoque/movimentacao", {
        method: "POST",
        body: JSON.stringify({
          productId: produtoModal,
          tipo: tipoModal,
          quantidade: quantidadeModal,
          motivo: motivoModal.trim(),
          dataHora: dataHoraModal,
        }),
      });
      onSucesso();
      onClose();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : "Erro ao salvar movimentação.");
    } finally {
      setSalvandoModal(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(10,10,14,0.55)",
          backdropFilter: "blur(3px)",
        }}
      />

      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 501,
        transform: "translate(-50%, -50%)",
        width: "min(480px, calc(100vw - 32px))",
        background: "var(--surface)",
        borderRadius: 20,
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--s6)",
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--night)" }}>
            Registrar movimentação
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 6, borderRadius: 8,
              display: "flex", alignItems: "center",
            }}
          >
            <IconeFechar size={18} />
          </button>
        </div>

        {/* Formulário */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Produto */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--night)", marginBottom: 6 }}>
              Produto
            </label>
            <select
              value={produtoModal}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProdutoModal(e.target.value)}
              style={{
                width: "100%", border: "1px solid var(--s6)", borderRadius: 10,
                padding: "9px 12px", fontSize: 14, outline: "none",
                background: "var(--surface)", color: "var(--night)",
                cursor: "pointer",
              }}
            >
              {itens.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.productName}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--night)", marginBottom: 6 }}>
              Tipo
            </label>
            <select
              value={tipoModal}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoModal(e.target.value as TipoMovimento)}
              style={{
                width: "100%", border: "1px solid var(--s6)", borderRadius: 10,
                padding: "9px 12px", fontSize: 14, outline: "none",
                background: "var(--surface)", color: "var(--night)",
                cursor: "pointer",
              }}
            >
              <option value="replenishment">Entrada</option>
              <option value="manual_adjustment">Ajuste</option>
              <option value="cancellation">Saída</option>
            </select>
          </div>

          {/* Quantidade */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--night)", marginBottom: 6 }}>
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              value={quantidadeModal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantidadeModal(Number(e.target.value))}
              style={{
                width: "100%", border: "1px solid var(--s6)", borderRadius: 10,
                padding: "9px 12px", fontSize: 14, outline: "none",
                background: "var(--surface)", color: "var(--night)",
              }}
            />
          </div>

          {/* Motivo */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--night)", marginBottom: 6 }}>
              Motivo {motivoObrigatorio ? <span style={{ color: "#dc2626" }}>*</span> : <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>}
            </label>
            <input
              type="text"
              value={motivoModal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMotivoModal(e.target.value)}
              placeholder={motivoObrigatorio ? "Informe o motivo..." : "Opcional"}
              style={{
                width: "100%", border: "1px solid var(--s6)", borderRadius: 10,
                padding: "9px 12px", fontSize: 14, outline: "none",
                background: "var(--surface)", color: "var(--night)",
              }}
            />
          </div>

          {/* Data e hora */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--night)", marginBottom: 6 }}>
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={dataHoraModal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataHoraModal(e.target.value)}
              style={{
                width: "100%", border: "1px solid var(--s6)", borderRadius: 10,
                padding: "9px 12px", fontSize: 14, outline: "none",
                background: "var(--surface)", color: "var(--night)",
              }}
            />
          </div>

          {/* Erro */}
          {erroModal && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626",
            }}>
              {erroModal}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{
          display: "flex", gap: 10, justifyContent: "flex-end",
          padding: "14px 24px", borderTop: "1px solid var(--s6)",
        }}>
          <button
            type="button"
            className="wp-btn wp-btn-secondary"
            onClick={onClose}
            disabled={salvandoModal}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={handleSalvar}
            disabled={salvandoModal}
          >
            {salvandoModal ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function EstoquePage() {
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroEstoque>("todos");
  const [busca, setBusca] = useState<string>("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ItemEstoque | null>(null);
  const [modalAberto, setModalAberto] = useState<boolean>(false);

  const carregarEstoque = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await fetchComAuth<ItemEstoque[]>("/partner/estoque");
      setItens(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar estoque.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque]);

  // Filtros e busca
  const itensFiltrados = itens.filter((item) => {
    const termoBusca = busca.trim().toLowerCase();
    const passaBusca = !termoBusca || item.productName.toLowerCase().includes(termoBusca);

    if (!passaBusca) return false;

    switch (filtro) {
      case "critico": return item.status === "critico";
      case "zerado":  return item.currentStock === 0;
      case "normal":  return item.status === "ok";
      default:        return true;
    }
  });

  const itensCriticos = itens.filter((i) => i.status === "critico");

  return (
    <div className="wp-stack-lg">
      {/* Cabeçalho da página */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1 className="wp-page-title">Estoque</h1>
            <p className="wp-page-subtitle">
              Controle de inventário, giro e curva ABC.
            </p>
          </div>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={() => setModalAberto(true)}
            disabled={itens.length === 0}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Registrar movimentação
          </button>
        </div>
      </div>

      {/* Banner de alerta — itens críticos */}
      {itensCriticos.length > 0 && (
        <button
          type="button"
          onClick={() => setFiltro("critico")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", textAlign: "left",
            background: "#fef3c7", border: "1px solid #fcd34d",
            borderRadius: 10, padding: "12px 16px",
            cursor: "pointer", color: "#92400e",
            fontSize: 14, fontWeight: 600,
            transition: "background 0.15s",
          }}
        >
          <IconeAlerta size={18} />
          <span>
            {itensCriticos.length} produto{itensCriticos.length !== 1 ? "s" : ""} abaixo do estoque mínimo
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, opacity: 0.75 }}>
            Ver críticos →
          </span>
        </button>
      )}

      {/* Filtros + Busca */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["todos", "critico", "zerado", "normal"] as FiltroEstoque[]).map((f) => {
            const labels: Record<FiltroEstoque, string> = {
              todos:  "Todos",
              critico: "Críticos",
              zerado: "Zerados",
              normal: "Normais",
            };
            const ativo = filtro === f;
            return (
              <button
                key={f}
                type="button"
                className={`wp-btn ${ativo ? "wp-btn-primary" : "wp-btn-secondary"}`}
                onClick={() => setFiltro(f)}
                style={{ fontSize: 13, padding: "7px 14px" }}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            value={busca}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            style={{
              width: "100%", border: "1px solid var(--s6)", borderRadius: 10,
              padding: "8px 12px", fontSize: 14, outline: "none",
              background: "var(--surface)", color: "var(--night)",
            }}
          />
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626",
        }}>
          {erro}
        </div>
      )}

      {/* Tabela */}
      <div className="wp-card" style={{ padding: 0, overflow: "hidden" }}>
        {carregando ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)", fontSize: 14 }}>
            Carregando estoque...
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)", fontSize: 14 }}>
            {busca || filtro !== "todos"
              ? "Nenhum produto encontrado com os filtros aplicados."
              : "Nenhum item de estoque cadastrado."}
          </div>
        ) : (
          <table className="wp-table" style={{ borderRadius: 0 }}>
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ textAlign: "center" }}>Estoque atual</th>
                <th style={{ textAlign: "center" }}>Estoque mínimo</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Giro</th>
                <th style={{ textAlign: "center" }}>Curva ABC</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setProdutoSelecionado(item)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--night)" }}>
                      {item.productName}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700, fontSize: 14,
                      color: item.currentStock === 0 ? "#dc2626" : "var(--night)",
                    }}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13, color: "var(--text-muted)",
                    }}>
                      {item.safetyStock}
                    </span>
                  </td>
                  <td>
                    <PontoStatus status={item.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13, color: "var(--text-muted)",
                    }}>
                      {item.giro.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <BadgeCurva curva={item.curvaABC} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: "var(--text-muted)", display: "flex", justifyContent: "center" }}>
                      <IconeHistorico size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rodapé com contagem */}
      {!carregando && itensFiltrados.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
          {itensFiltrados.length} de {itens.length} produto{itens.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Drawer de histórico */}
      <DrawerHistorico
        produto={produtoSelecionado}
        onClose={() => setProdutoSelecionado(null)}
      />

      {/* Modal de movimentação */}
      {modalAberto && (
        <ModalMovimentacao
          itens={itens}
          onClose={() => setModalAberto(false)}
          onSucesso={carregarEstoque}
        />
      )}
    </div>
  );
}
