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

// ─── Tipos ───────────────────────────────────────────────────────────────────

type CaixaTurno = {
  id: string;
  abreuEm: string;
  fechouEm: string | null;
  abertoPor: string;
  fechadoPor: string | null;
  saldoInicial: number;
  saldoFinal: number | null;
  observacoes: string | null;
};

type ResumoTurno = {
  turno: {
    id: string;
    abreuEm: string;
    fechouEm: string | null;
    saldoInicial: number;
    saldoFinal: number | null;
    observacoes: string | null;
  };
  totalPedidos: number;
  totalVendasCents: number;
  porMetodo: { metodo: string; totalCents: number; quantidade: number }[];
};

type HistoricoResult = {
  turnos: CaixaTurno[];
  total: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duracaoTurno(abertura: string, fechamento: string | null) {
  const fim = fechamento ? new Date(fechamento) : new Date();
  const inicio = new Date(abertura);
  const mins = Math.round((fim.getTime() - inicio.getTime()) / 60000);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const METODO_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_on_delivery: "Cartão",
  card_online: "Cartão Online",
};

// ─── Modal de Abertura ───────────────────────────────────────────────────────

function ModalAbrirCaixa({
  onFechar,
  onConcluido,
}: {
  onFechar: () => void;
  onConcluido: () => void;
}) {
  const [saldo, setSaldo] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleAbrir() {
    const saldoCents = Math.round(parseFloat(saldo.replace(",", ".")) * 100);
    if (isNaN(saldoCents) || saldoCents < 0) {
      setErro("Informe um saldo inicial válido (pode ser R$ 0,00).");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await fetchComAuth("/partner/caixa/abrir", {
        method: "POST",
        body: JSON.stringify({ saldoInicial: saldoCents, observacoes: obs.trim() || null }),
      });
      onConcluido();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao abrir caixa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wp-modal-overlay" onClick={onFechar}>
      <div className="wp-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="wp-modal-header">
          <h2>Abrir Caixa</h2>
          <button type="button" className="wp-modal-close" onClick={onFechar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="wp-modal-body">
          <div className="wp-stack" style={{ gap: 16 }}>
            <div className="wp-form-group">
              <label className="wp-label">Saldo inicial (troco em caixa)</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}>R$</span>
                <input
                  className="wp-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Observações (opcional)</label>
              <textarea
                className="wp-input"
                rows={2}
                placeholder="Ex.: abertura de turno manhã"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {erro && (
              <div style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#dc2626",
                fontSize: 13,
              }}>
                {erro}
              </div>
            )}
          </div>
        </div>

        <div className="wp-modal-footer">
          <button type="button" className="wp-btn wp-btn-secondary" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={handleAbrir}
            disabled={loading}
          >
            {loading ? "Abrindo..." : "Abrir Caixa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Fechamento ─────────────────────────────────────────────────────

function ModalFecharCaixa({
  turno,
  resumo,
  onFechar,
  onConcluido,
}: {
  turno: CaixaTurno;
  resumo: ResumoTurno | null;
  onFechar: () => void;
  onConcluido: () => void;
}) {
  const [saldoFinal, setSaldoFinal] = useState("");
  const [obs, setObs] = useState(turno.observacoes ?? "");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFechar() {
    const saldoCents = Math.round(parseFloat(saldoFinal.replace(",", ".")) * 100);
    if (isNaN(saldoCents) || saldoCents < 0) {
      setErro("Informe o saldo final do caixa.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await fetchComAuth("/partner/caixa/fechar", {
        method: "POST",
        body: JSON.stringify({
          turnoId: turno.id,
          saldoFinal: saldoCents,
          observacoes: obs.trim() || null,
        }),
      });
      onConcluido();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao fechar caixa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wp-modal-overlay" onClick={onFechar}>
      <div className="wp-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="wp-modal-header">
          <h2>Fechar Caixa</h2>
          <button type="button" className="wp-modal-close" onClick={onFechar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="wp-modal-body">
          <div className="wp-stack" style={{ gap: 16 }}>
            {/* Resumo do turno */}
            {resumo && (
              <div style={{
                background: "var(--cream)",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Resumo do turno
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pedidos</div>
                    <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {resumo.totalPedidos}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total vendas</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "var(--g)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {formatCurrency(resumo.totalVendasCents)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Abertura</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(turno.saldoInicial)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Duração</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {duracaoTurno(turno.abreuEm, null)}
                    </div>
                  </div>
                </div>
                {resumo.porMetodo.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Por método de pagamento</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {resumo.porMetodo.map((m) => (
                        <div key={m.metodo} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span>{METODO_LABELS[m.metodo] ?? m.metodo} ({m.quantidade}x)</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(m.totalCents)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="wp-form-group">
              <label className="wp-label">Saldo final em caixa</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}>R$</span>
                <input
                  className="wp-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={saldoFinal}
                  onChange={(e) => setSaldoFinal(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div className="wp-form-group">
              <label className="wp-label">Observações (opcional)</label>
              <textarea
                className="wp-input"
                rows={2}
                placeholder="Ex.: fechamento sem divergências"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {erro && (
              <div style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#dc2626",
                fontSize: 13,
              }}>
                {erro}
              </div>
            )}
          </div>
        </div>

        <div className="wp-modal-footer">
          <button type="button" className="wp-btn wp-btn-secondary" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="wp-btn"
            onClick={handleFechar}
            disabled={loading}
            style={{ background: "#dc2626", color: "#fff", border: "none" }}
          >
            {loading ? "Fechando..." : "Fechar Caixa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function CaixaPage() {
  const [turnoAtual, setTurnoAtual] = useState<CaixaTurno | null>(null);
  const [resumo, setResumo] = useState<ResumoTurno | null>(null);
  const [historico, setHistorico] = useState<CaixaTurno[]>([]);
  const [historicoTotal, setHistoricoTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [atual, hist] = await Promise.all([
        fetchComAuth<CaixaTurno | null>("/partner/caixa/atual"),
        fetchComAuth<HistoricoResult>("/partner/caixa/historico?limit=10&offset=0"),
      ]);
      setTurnoAtual(atual);
      setHistorico(hist.turnos);
      setHistoricoTotal(hist.total);

      if (atual) {
        const res = await fetchComAuth<ResumoTurno>(`/partner/caixa/resumo/${atual.id}`);
        setResumo(res);
      } else {
        setResumo(null);
      }
    } catch {
      // silencioso — estado vazio já cobre
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function onConcluirAbertura() {
    setModalAbrir(false);
    void carregar();
  }

  function onConcluirFechamento() {
    setModalFechar(false);
    void carregar();
  }

  if (carregando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
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
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Badge de status */}
            <span
              className={`wp-badge ${turnoAtual ? "wp-badge-green" : "wp-badge-muted"}`}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: turnoAtual ? "var(--g)" : "var(--text-muted)",
                display: "inline-block",
              }} />
              {turnoAtual ? "Caixa aberto" : "Caixa fechado"}
            </span>
            {turnoAtual ? (
              <button
                type="button"
                className="wp-btn"
                onClick={() => setModalFechar(true)}
                style={{ background: "#dc2626", color: "#fff", border: "none" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                Fechar Caixa
              </button>
            ) : (
              <button
                type="button"
                className="wp-btn wp-btn-primary"
                onClick={() => setModalAbrir(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Abrir Caixa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Turno atual */}
      {turnoAtual && resumo && (
        <div className="wp-panel" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Turno atual
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Abertura</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{formatarData(turnoAtual.abreuEm)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Duração</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{duracaoTurno(turnoAtual.abreuEm, null)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Saldo inicial</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(turnoAtual.saldoInicial)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Pedidos no turno</div>
              <div style={{ fontWeight: 700, fontSize: 22, fontFamily: "'Space Grotesk', sans-serif" }}>
                {resumo.totalPedidos}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Total vendido</div>
              <div style={{ fontWeight: 700, fontSize: 22, color: "var(--g)", fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCurrency(resumo.totalVendasCents)}
              </div>
            </div>
          </div>

          {resumo.porMetodo.length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Por método de pagamento
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {resumo.porMetodo.map((m) => (
                  <div
                    key={m.metodo}
                    style={{
                      background: "var(--cream)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "10px 16px",
                      minWidth: 130,
                    }}
                  >
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
      )}

      {/* Sem turno aberto */}
      {!turnoAtual && (
        <div className="wp-panel" style={{ marginBottom: 24 }}>
          <div className="wp-empty">
            <div className="wp-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
            <p className="wp-empty-title">Caixa fechado</p>
            <p className="wp-empty-desc">Abra o caixa para começar a registrar as vendas do turno.</p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={() => setModalAbrir(true)}
              style={{ marginTop: 12 }}
            >
              Abrir Caixa
            </button>
          </div>
        </div>
      )}

      {/* Histórico de turnos */}
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
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {t.fechouEm ? formatarData(t.fechouEm) : "—"}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {duracaoTurno(t.abreuEm, t.fechouEm)}
                  </td>
                  <td style={{ fontSize: 13 }}>{formatCurrency(t.saldoInicial)}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>
                    {t.saldoFinal != null ? formatCurrency(t.saldoFinal) : "—"}
                  </td>
                  <td>
                    {t.fechouEm ? (
                      <span className="wp-badge wp-badge-muted">Encerrado</span>
                    ) : (
                      <span className="wp-badge wp-badge-green">Aberto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modais */}
      {modalAbrir && (
        <ModalAbrirCaixa
          onFechar={() => setModalAbrir(false)}
          onConcluido={onConcluirAbertura}
        />
      )}

      {modalFechar && turnoAtual && (
        <ModalFecharCaixa
          turno={turnoAtual}
          resumo={resumo}
          onFechar={() => setModalFechar(false)}
          onConcluido={onConcluirFechamento}
        />
      )}
    </>
  );
}
