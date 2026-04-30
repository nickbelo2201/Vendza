"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@vendza/utils";
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
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Erro ${res.status}`);
  return json.data as T;
}

type CaixaTurno = {
  id: string;
  abreuEm: string;
  fechouEm: string | null;
  saldoInicial: number;
  saldoFinal: number | null;
  observacoes: string | null;
};

type ResumoTurno = {
  turno: CaixaTurno;
  totalPedidos: number;
  totalVendasCents: number;
  porMetodo: { metodo: string; totalCents: number; quantidade: number }[];
};

type HistoricoResult = { turnos: CaixaTurno[]; total: number };

const METODO_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_on_delivery: "Cartão",
  card_online: "Cartão Online",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function duracaoTurno(abertura: string, fechamento: string | null) {
  const mins = Math.round((new Date(fechamento ?? new Date()).getTime() - new Date(abertura).getTime()) / 60000);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Modal Abrir ─────────────────────────────────────────────────────────────

function ModalAbrirCaixa({ onFechar, onConcluido }: { onFechar: () => void; onConcluido: () => void }) {
  const [saldo, setSaldo] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleAbrir() {
    const saldoCents = Math.round(parseFloat(saldo.replace(",", ".")) * 100);
    if (isNaN(saldoCents) || saldoCents < 0) { setErro("Informe um saldo inicial válido."); return; }
    setLoading(true); setErro(null);
    try {
      await fetchComAuth("/partner/caixa/abrir", {
        method: "POST",
        body: JSON.stringify({ saldoInicial: saldoCents, observacoes: obs.trim() || null }),
      });
      onConcluido();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao abrir caixa.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,10,14,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(4px)",
    }} onClick={onFechar}>
      <div style={{
        background: "var(--surface)", borderRadius: 20,
        width: "100%", maxWidth: 420,
        boxShadow: "0 32px 80px rgba(15,23,42,.22)",
        overflow: "hidden",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header com ícone */}
        <div style={{
          padding: "32px 32px 24px",
          background: "var(--gl, #e8f5f0)",
          borderBottom: "1px solid var(--g-border, rgba(26,122,94,0.18))",
          textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "var(--g)", margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(45,106,79,.35)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/>
              <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--carbon)", margin: 0 }}>
            Abrir Caixa
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Registre o saldo inicial antes de começar as vendas
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 32px 28px" }}>
          <div className="wp-stack" style={{ gap: 16 }}>
            <div className="wp-form-group">
              <label className="wp-label">Troco disponível no caixa</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>R$</span>
                <input
                  className="wp-input"
                  type="number" min="0" step="0.01"
                  placeholder="0,00"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  style={{ paddingLeft: 44, fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}
                  autoFocus
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Quantia em espécie disponível para dar troco
              </span>
            </div>

            {/* Sugestões rápidas */}
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                Valores comuns
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[0, 50, 100, 150, 200].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSaldo(v === 0 ? "0" : String(v))}
                    style={{
                      padding: "6px 14px", borderRadius: 8,
                      border: `1.5px solid ${saldo === String(v) || (v === 0 && saldo === "0") ? "var(--g)" : "var(--border)"}`,
                      background: saldo === String(v) || (v === 0 && saldo === "0") ? "var(--g)" : "transparent",
                      color: saldo === String(v) || (v === 0 && saldo === "0") ? "#fff" : "var(--text-muted)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    {v === 0 ? "R$ 0" : `R$ ${v}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Observações <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
              <textarea
                className="wp-input"
                rows={2}
                placeholder="Ex.: abertura do turno manhã"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {erro && (
              <div style={{
                padding: "10px 14px", background: "#fef2f2",
                border: "1px solid #fecaca", borderRadius: 8,
                color: "#dc2626", fontSize: 13,
              }}>
                {erro}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button type="button" className="wp-button wp-button-secondary" onClick={onFechar} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button
                type="button"
                className="wp-button"
                onClick={handleAbrir}
                disabled={loading}
                style={{ flex: 2 }}
              >
                {loading ? "Abrindo..." : "Abrir Caixa"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Fechar ─────────────────────────────────────────────────────────────

function ModalFecharCaixa({
  turno, resumo, onFechar, onConcluido,
}: {
  turno: CaixaTurno; resumo: ResumoTurno | null;
  onFechar: () => void; onConcluido: () => void;
}) {
  const [saldoFinal, setSaldoFinal] = useState("");
  const [obs, setObs] = useState(turno.observacoes ?? "");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFechar() {
    const saldoCents = Math.round(parseFloat(saldoFinal.replace(",", ".")) * 100);
    if (isNaN(saldoCents) || saldoCents < 0) { setErro("Informe o saldo final."); return; }
    setLoading(true); setErro(null);
    try {
      await fetchComAuth("/partner/caixa/fechar", {
        method: "POST",
        body: JSON.stringify({ turnoId: turno.id, saldoFinal: saldoCents, observacoes: obs.trim() || null }),
      });
      onConcluido();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao fechar caixa.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,10,14,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(4px)",
    }} onClick={onFechar}>
      <div style={{
        background: "var(--surface)", borderRadius: 20,
        width: "100%", maxWidth: 460,
        boxShadow: "0 32px 80px rgba(15,23,42,.22)",
        overflow: "hidden",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{
          padding: "28px 32px 20px",
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
          borderBottom: "1px solid #fecaca",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "#dc2626", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(220,38,38,.3)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--carbon)", margin: 0 }}>Fechar Caixa</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
              Turno aberto há {duracaoTurno(turno.abreuEm, null)}
            </p>
          </div>
        </div>

        <div style={{ padding: "24px 32px 28px" }}>
          <div className="wp-stack" style={{ gap: 16 }}>
            {resumo && (
              <div style={{
                background: "var(--cream)", borderRadius: 12,
                padding: "16px", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Resumo do turno
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Pedidos</div>
                    <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "'Space Grotesk', sans-serif" }}>{resumo.totalPedidos}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Vendas</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--g)", fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(resumo.totalVendasCents)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Saldo abertura</div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(turno.saldoInicial)}</div>
                  </div>
                </div>
                {resumo.porMetodo.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    {resumo.porMetodo.map((m) => (
                      <div key={m.metodo} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                        <span style={{ color: "var(--text-muted)" }}>{METODO_LABELS[m.metodo] ?? m.metodo} ({m.quantidade}x)</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(m.totalCents)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="wp-form-group">
              <label className="wp-label">Saldo final em espécie</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>R$</span>
                <input
                  className="wp-input"
                  type="number" min="0" step="0.01" placeholder="0,00"
                  value={saldoFinal}
                  onChange={(e) => setSaldoFinal(e.target.value)}
                  style={{ paddingLeft: 44, fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}
                  autoFocus
                />
              </div>
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Observações <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
              <textarea
                className="wp-input"
                rows={2}
                placeholder="Ex.: fechamento sem ocorrências"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {erro && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
                {erro}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button type="button" className="wp-button wp-button-secondary" onClick={onFechar} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button
                type="button"
                className="wp-button"
                onClick={handleFechar}
                disabled={loading}
                style={{ flex: 2, background: "#dc2626" }}
              >
                {loading ? "Fechando..." : "Confirmar Fechamento"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CaixaPage() {
  const [turno, setTurno] = useState<CaixaTurno | null>(null);
  const [resumo, setResumo] = useState<ResumoTurno | null>(null);
  const [historico, setHistorico] = useState<CaixaTurno[]>([]);
  const [historicoTotal, setHistoricoTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [atual, hist] = await Promise.all([
        fetchComAuth<CaixaTurno | null>("/partner/caixa/atual"),
        fetchComAuth<HistoricoResult>("/partner/caixa/historico?limit=10&offset=0"),
      ]);
      setTurno(atual);
      setHistorico(hist.turnos);
      setHistoricoTotal(hist.total);
      if (atual) {
        const res = await fetchComAuth<ResumoTurno>(`/partner/caixa/resumo/${atual.id}`);
        setResumo(res);
      } else {
        setResumo(null);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os dados do caixa.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  if (carregando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{erro}</p>
        <button
          onClick={() => void carregar()}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 14 }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Controle de Caixa</h1>
            <p>Abertura, fechamento e resumo por turno.</p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20,
            background: turno ? "#f0fdf4" : "#f9fafb",
            border: `1px solid ${turno ? "#bbf7d0" : "var(--border)"}`,
            fontSize: 13, fontWeight: 600,
            color: turno ? "#16a34a" : "var(--text-muted)",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: turno ? "#22c55e" : "#d1d5db",
              display: "inline-block",
              boxShadow: turno ? "0 0 0 3px rgba(34,197,94,.2)" : "none",
            }} />
            {turno ? "Caixa aberto" : "Caixa fechado"}
          </span>
        </div>
      </div>

      {/* ── Estado FECHADO ── */}
      {!turno && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{
            background: "var(--surface)", borderRadius: 24,
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(15,23,42,.08)",
            maxWidth: 400, width: "100%",
            overflow: "hidden",
          }}>
            {/* Ilustração */}
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              padding: "40px 32px 32px",
              textAlign: "center",
              borderBottom: "1px solid #bbf7d0",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: "var(--g)", margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 32px rgba(45,106,79,.3)",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/>
                  <line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--carbon)", margin: "0 0 8px" }}>
                Nenhum turno aberto
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Abra o caixa para começar a registrar as vendas do turno atual
              </p>
            </div>

            <div style={{ padding: "28px 32px" }}>
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={() => setModalAbrir(true)}
                style={{ width: "100%", justifyContent: "center", padding: "13px 0", fontSize: 15, fontWeight: 700 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Abrir Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Estado ABERTO ── */}
      {turno && resumo && (
        <div style={{ marginBottom: 24 }}>
          {/* Card principal */}
          <div style={{
            background: "var(--surface)", borderRadius: 20,
            border: "1px solid var(--border)",
            boxShadow: "0 4px 16px rgba(15,23,42,.06)",
            overflow: "hidden", marginBottom: 16,
          }}>
            {/* Header do turno */}
            <div style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              borderBottom: "1px solid #bbf7d0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Turno em andamento
                </div>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  Aberto às {new Date(turno.abreuEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  <span style={{ fontWeight: 600, color: "var(--carbon)" }}>{duracaoTurno(turno.abreuEm, null)}</span>
                </div>
              </div>
              <button
                type="button"
                className="wp-btn"
                onClick={() => setModalFechar(true)}
                style={{ background: "#dc2626", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                Fechar Caixa
              </button>
            </div>

            {/* Métricas */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
                <div style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Pedidos no turno</div>
                  <div style={{ fontWeight: 700, fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", color: "var(--carbon)" }}>
                    {resumo.totalPedidos}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 11, color: "#16a34a", marginBottom: 6 }}>Total vendido</div>
                  <div style={{ fontWeight: 700, fontSize: 24, fontFamily: "'Space Grotesk', sans-serif", color: "#16a34a" }}>
                    {formatCurrency(resumo.totalVendasCents)}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Saldo inicial</div>
                  <div style={{ fontWeight: 600, fontSize: 18, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatCurrency(turno.saldoInicial)}
                  </div>
                </div>
              </div>

              {resumo.porMetodo.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Por método de pagamento
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {resumo.porMetodo.map((m) => (
                      <div key={m.metodo} style={{
                        background: "var(--cream)", border: "1px solid var(--border)",
                        borderRadius: 10, padding: "10px 16px", minWidth: 130,
                      }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                          {METODO_LABELS[m.metodo] ?? m.metodo}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {formatCurrency(m.totalCents)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {m.quantidade} pedido{m.quantidade !== 1 ? "s" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Histórico de turnos</span>
          <span className="wp-badge wp-badge-muted">{historicoTotal} turno{historicoTotal !== 1 ? "s" : ""}</span>
        </div>
        {historico.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Nenhum turno registrado ainda.
          </div>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th>Duração</th>
                <th>Saldo inicial</th>
                <th>Saldo final</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontSize: 13 }}>{formatarData(t.abreuEm)}</td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.fechouEm ? formatarData(t.fechouEm) : "—"}</td>
                  <td style={{ fontSize: 13 }}>{duracaoTurno(t.abreuEm, t.fechouEm)}</td>
                  <td style={{ fontSize: 13 }}>{formatCurrency(t.saldoInicial)}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{t.saldoFinal != null ? formatCurrency(t.saldoFinal) : "—"}</td>
                  <td>
                    {t.fechouEm
                      ? <span className="wp-badge wp-badge-muted">Encerrado</span>
                      : <span className="wp-badge wp-badge-green">Aberto</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbrir && (
        <ModalAbrirCaixa
          onFechar={() => setModalAbrir(false)}
          onConcluido={() => { setModalAbrir(false); void carregar(); }}
        />
      )}
      {modalFechar && turno && (
        <ModalFecharCaixa
          turno={turno} resumo={resumo}
          onFechar={() => setModalFechar(false)}
          onConcluido={() => { setModalFechar(false); void carregar(); }}
        />
      )}
    </>
  );
}
