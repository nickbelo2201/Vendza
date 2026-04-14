"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { createClient } from "../../../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

// ─── Fetch helpers ────────────────────────────────────────────────────────────

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

async function fetchComAuthBlob(path: string): Promise<Blob> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const res = await fetch(`${API_URL}/v1${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.blob();
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type KPIValor = { centavos: number; comparacao: number | null };
type KPIPedidosPagos = { count: number; centavos: number; comparacao: number | null };
type KPIPedidosPendentes = { count: number; centavos: number; pendentesAntigoCount: number };
type KPICancelamentos = { count: number; centavos: number; comparacao: number | null };

type DadosFinanceiro = {
  kpis: {
    receitaBruta: KPIValor;
    receitaLiquida: KPIValor;
    pedidosPagos: KPIPedidosPagos;
    pedidosPendentes: KPIPedidosPendentes;
    ticketMedio: KPIValor;
    cancelamentos: KPICancelamentos;
  };
  receitaPorDia: Array<{ date: string; pagoCentavos: number; totalCentavos: number; pedidos: number }>;
  breakdownStatus: Array<{ status: string; label: string; count: number; centavos: number }>;
  breakdownMetodo: Array<{ method: string; label: string; count: number; centavos: number }>;
};

type ItemExtrato = {
  id: string;
  publicId: string;
  dataHora: string;
  cliente: string;
  valorBrutoCentavos: number;
  taxasCentavos: number;
  valorLiquidoCentavos: number;
  metodoPagamento: string;
  statusPagamento: string;
};

type RespostaExtrato = {
  data: ItemExtrato[];
  total: number;
  page: number;
  pageSize: number;
  totalFiltradoCentavos: number;
};

type PeriodoRapido = "hoje" | "7d" | "15d" | "30d" | "mes-atual" | "mes-anterior" | "personalizado";
type AgregacaoGrafico = "diario" | "semanal" | "mensal";
type OrdemDir = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarCentavos(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

function formatarCentavosAbreviado(centavos: number): string {
  const reais = centavos / 100;
  if (reais >= 1000000) return `R$ ${(reais / 1000000).toFixed(1)}M`;
  if (reais >= 1000) return `R$ ${(reais / 1000).toFixed(1)}k`;
  return formatarCentavos(centavos);
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatarDiaMes(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calcularPeriodo(periodo: PeriodoRapido): { from: string; to: string } {
  const hoje = new Date();
  const to = toISO(hoje);

  switch (periodo) {
    case "hoje":
      return { from: to, to };
    case "7d": {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 6);
      return { from: toISO(d), to };
    }
    case "15d": {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 14);
      return { from: toISO(d), to };
    }
    case "30d": {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 29);
      return { from: toISO(d), to };
    }
    case "mes-atual": {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return { from: toISO(d), to };
    }
    case "mes-anterior": {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return { from: toISO(inicio), to: toISO(fim) };
    }
    default:
      return { from: to, to };
  }
}

function agregarSemanal(dados: DadosFinanceiro["receitaPorDia"]) {
  const mapa: Record<string, { pagoCentavos: number; totalCentavos: number; pedidos: number; date: string }> = {};
  dados.forEach((d) => {
    const dt = new Date(d.date + "T00:00:00");
    const dia = dt.getDay();
    const diff = (dia + 6) % 7;
    const segunda = new Date(dt);
    segunda.setDate(dt.getDate() - diff);
    const chave = toISO(segunda);
    if (!mapa[chave]) {
      mapa[chave] = { pagoCentavos: 0, totalCentavos: 0, pedidos: 0, date: chave };
    }
    mapa[chave].pagoCentavos += d.pagoCentavos;
    mapa[chave].totalCentavos += d.totalCentavos;
    mapa[chave].pedidos += d.pedidos;
  });
  return Object.values(mapa).sort((a, b) => a.date.localeCompare(b.date));
}

function agregarMensal(dados: DadosFinanceiro["receitaPorDia"]) {
  const mapa: Record<string, { pagoCentavos: number; totalCentavos: number; pedidos: number; date: string }> = {};
  dados.forEach((d) => {
    const chave = d.date.slice(0, 7);
    if (!mapa[chave]) {
      mapa[chave] = { pagoCentavos: 0, totalCentavos: 0, pedidos: 0, date: chave + "-01" };
    }
    mapa[chave].pagoCentavos += d.pagoCentavos;
    mapa[chave].totalCentavos += d.totalCentavos;
    mapa[chave].pedidos += d.pedidos;
  });
  return Object.values(mapa).sort((a, b) => a.date.localeCompare(b.date));
}

async function baixarCSV(path: string, nome: string) {
  try {
    const blob = await fetchComAuthBlob(path);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Erro ao baixar CSV.");
  }
}

// ─── Cores ───────────────────────────────────────────────────────────────────

const COR_PAGO = "#16a34a";
const COR_PENDENTE = "#d97706";
const COR_CANCELADO = "#dc2626";
const COR_REEMBOLSADO = "#94a3b8";

const STATUS_CORES: Record<string, string> = {
  pago: COR_PAGO,
  paid: COR_PAGO,
  pendente: COR_PENDENTE,
  pending: COR_PENDENTE,
  cancelado: COR_CANCELADO,
  cancelled: COR_CANCELADO,
  reembolsado: COR_REEMBOLSADO,
  refunded: COR_REEMBOLSADO,
};

// ─── Componentes de ícone ─────────────────────────────────────────────────────

function IconeFechar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconeReceita() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function IconePedidos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconeTicket() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    </svg>
  );
}

function IconeAlerta({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconeOrdenar({ ativo = false, dir = "asc" }: { ativo?: boolean; dir?: OrdemDir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ativo ? "var(--green, #2D6A4F)" : "var(--text-muted)"} strokeWidth="2.5">
      {dir === "asc" ? (
        <polyline points="18 15 12 9 6 15"/>
      ) : (
        <polyline points="6 9 12 15 18 9"/>
      )}
    </svg>
  );
}

function IconeExportar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ width = "100%", height = 20, radius = 8 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <div style={{
      width, height,
      background: "var(--s8)",
      borderRadius: radius,
      opacity: 0.6,
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

// ─── Badge de comparação ──────────────────────────────────────────────────────

function BadgeComparacao({ comparacao }: { comparacao: number | null }) {
  if (comparacao === null) {
    return <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>—</span>;
  }
  const positivo = comparacao >= 0;
  const cor = positivo ? COR_PAGO : COR_CANCELADO;
  const seta = positivo ? "↑" : "↓";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      fontSize: 12, fontWeight: 600, color: cor,
      background: positivo ? "#f0fdf4" : "#fef2f2",
      borderRadius: 6, padding: "2px 7px",
    }}>
      {seta} {Math.abs(comparacao).toFixed(1)}%
    </span>
  );
}

// ─── Badge de status ──────────────────────────────────────────────────────────

function BadgeStatus({ status }: { status: string }) {
  const cor = STATUS_CORES[status.toLowerCase()] ?? "#94a3b8";
  const labels: Record<string, string> = {
    pago: "Pago", paid: "Pago",
    pendente: "Pendente", pending: "Pendente",
    cancelado: "Cancelado", cancelled: "Cancelado",
    reembolsado: "Reembolsado", refunded: "Reembolsado",
  };
  const label = labels[status.toLowerCase()] ?? status;
  const bgMap: Record<string, string> = {
    "#16a34a": "#f0fdf4",
    "#d97706": "#fffbeb",
    "#dc2626": "#fef2f2",
    "#94a3b8": "#f1f5f9",
  };
  const bg = bgMap[cor] ?? "#f1f5f9";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color: cor,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 12, fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

type KPICardProps = {
  label: string;
  icone: React.ReactNode;
  valor: string;
  comparacao?: number | null;
  extras?: React.ReactNode;
  carregando?: boolean;
};

function KPICard({ label, icone, valor, comparacao, extras, carregando = false }: KPICardProps) {
  return (
    <div className="wp-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {label}
        </span>
        <span style={{ color: "var(--text-muted)", display: "flex" }}>{icone}</span>
      </div>

      {carregando ? (
        <>
          <Skeleton height={32} radius={6} />
          <Skeleton height={18} width="60%" radius={6} />
        </>
      ) : (
        <>
          <div style={{
            fontSize: 26, fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            color: "var(--night)",
            lineHeight: 1.1,
          }}>
            {valor}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {comparacao !== undefined && <BadgeComparacao comparacao={comparacao ?? null} />}
            {extras}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tooltip do gráfico de área ───────────────────────────────────────────────

type TooltipAreaPayload = {
  value: number;
  name: string;
  payload: {
    date: string;
    pagoCentavos: number;
    totalCentavos: number;
    pedidos: number;
    label: string;
  };
};

function TooltipArea({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipAreaPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div style={{
      background: "#1e293b",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 12,
      lineHeight: 1.7,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
      <div>Receita paga: {formatarCentavos(d.pagoCentavos)}</div>
      <div>Receita total: {formatarCentavos(d.totalCentavos)}</div>
      <div>Pedidos: {d.pedidos}</div>
    </div>
  );
}

// ─── Drawer de pedido ─────────────────────────────────────────────────────────

function DrawerPedido({ pedido, onClose }: { pedido: ItemExtrato | null; onClose: () => void }) {
  useEffect(() => {
    if (!pedido) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [pedido, onClose]);

  if (!pedido) return null;

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
        width: "min(400px, 100vw)",
        background: "var(--surface)",
        boxShadow: "-8px 0 40px rgba(15,23,42,.18)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--s6)", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--night)" }}>
              {pedido.publicId}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Detalhe do pedido
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

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Cliente", valor: pedido.cliente || "—" },
            { label: "Data/Hora", valor: formatarDataHora(pedido.dataHora) },
            { label: "Forma de Pagamento", valor: pedido.metodoPagamento },
            { label: "Status", valor: null, node: <BadgeStatus status={pedido.statusPagamento} /> },
          ].map((item) => (
            <div key={item.label} style={{
              background: "var(--s8)", borderRadius: 10,
              border: "1px solid var(--s6)", padding: "12px 16px",
            }}>
              <div style={{
                fontSize: 10, color: "var(--text-muted)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
              }}>
                {item.label}
              </div>
              {item.node ?? (
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--night)" }}>
                  {item.valor}
                </div>
              )}
            </div>
          ))}

          <div style={{
            background: "var(--s8)", borderRadius: 10,
            border: "1px solid var(--s6)", padding: "12px 16px",
          }}>
            <div style={{
              fontSize: 10, color: "var(--text-muted)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
            }}>
              Valores
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { l: "Valor Bruto", v: formatarCentavos(pedido.valorBrutoCentavos) },
                { l: "Taxas", v: formatarCentavos(pedido.taxasCentavos) },
                { l: "Valor Líquido", v: formatarCentavos(pedido.valorLiquidoCentavos), destaque: true },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.l}</span>
                  <span style={{
                    fontSize: 14, fontWeight: r.destaque ? 800 : 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: r.destaque ? "var(--night)" : "var(--text-muted)",
                  }}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  // Período
  const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>("30d");
  const [dataFrom, setDataFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toISO(d);
  });
  const [dataTo, setDataTo] = useState<string>(() => toISO(new Date()));

  // Dados principais
  const [dados, setDados] = useState<DadosFinanceiro | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroDados, setErroDados] = useState<string | null>(null);

  // Extrato
  const [extrato, setExtrato] = useState<RespostaExtrato | null>(null);
  const [carregandoExtrato, setCarregandoExtrato] = useState(true);
  const [erroExtrato, setErroExtrato] = useState<string | null>(null);
  const [paginaExtrato, setPaginaExtrato] = useState(1);
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("");
  const [orderBy, setOrderBy] = useState("dataHora");
  const [orderDir, setOrderDir] = useState<OrdemDir>("desc");

  // UI
  const [agregacao, setAgregacao] = useState<AgregacaoGrafico>("diario");
  const [exportarAberto, setExportarAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [pedidoDrawer, setPedidoDrawer] = useState<ItemExtrato | null>(null);
  const exportarRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown exportar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportarRef.current && !exportarRef.current.contains(e.target as Node)) {
        setExportarAberto(false);
      }
    }
    if (exportarAberto) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportarAberto]);

  // Sincronizar período rápido -> datas
  function aplicarPeriodoRapido(p: PeriodoRapido) {
    setPeriodoRapido(p);
    if (p !== "personalizado") {
      const { from, to } = calcularPeriodo(p);
      setDataFrom(from);
      setDataTo(to);
    }
    setPaginaExtrato(1);
  }

  // Carregar KPIs + gráfico
  const carregarDados = useCallback(async (from: string, to: string) => {
    setCarregandoDados(true);
    setErroDados(null);
    try {
      const res = await fetchComAuth<DadosFinanceiro>(
        `/partner/financeiro?from=${from}&to=${to}`
      );
      setDados(res);
    } catch (err) {
      setErroDados(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setCarregandoDados(false);
    }
  }, []);

  // Carregar extrato
  const carregarExtrato = useCallback(async (
    from: string, to: string,
    page: number, busca: string, status: string, metodo: string,
    ob: string, od: OrdemDir,
  ) => {
    setCarregandoExtrato(true);
    setErroExtrato(null);
    try {
      const params = new URLSearchParams({
        from, to,
        page: String(page),
        pageSize: "20",
        orderBy: ob,
        orderDir: od,
      });
      if (busca) params.set("busca", busca);
      if (status) params.set("status", status);
      if (metodo) params.set("metodo", metodo);

      const res = await fetchComAuth<RespostaExtrato>(
        `/partner/financeiro/extrato?${params.toString()}`
      );
      setExtrato(res);
    } catch (err) {
      setErroExtrato(err instanceof Error ? err.message : "Erro ao carregar extrato.");
    } finally {
      setCarregandoExtrato(false);
    }
  }, []);

  // Efeito: recarregar quando período muda
  useEffect(() => {
    carregarDados(dataFrom, dataTo);
  }, [dataFrom, dataTo, carregarDados]);

  useEffect(() => {
    carregarExtrato(dataFrom, dataTo, paginaExtrato, buscaExtrato, statusFiltro, metodoFiltro, orderBy, orderDir);
  }, [dataFrom, dataTo, paginaExtrato, buscaExtrato, statusFiltro, metodoFiltro, orderBy, orderDir, carregarExtrato]);

  // ─── Dados do gráfico com agregação ────────────────────────────────────────

  const dadosGrafico = (() => {
    const base = dados?.receitaPorDia ?? [];
    let agregado: typeof base;
    if (agregacao === "semanal") agregado = agregarSemanal(base);
    else if (agregacao === "mensal") agregado = agregarMensal(base);
    else agregado = base;

    return agregado.map((d) => ({
      ...d,
      label: formatarDiaMes(d.date),
    }));
  })();

  // ─── Seleção ──────────────────────────────────────────────────────────────

  const paginaIds = extrato?.data.map((i) => i.id) ?? [];
  const todosSelecionadosNaPagina = paginaIds.length > 0 && paginaIds.every((id) => selecionados.has(id));

  function toggleSelecionarTodos() {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (todosSelecionadosNaPagina) {
        paginaIds.forEach((id) => next.delete(id));
      } else {
        paginaIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─── Exportar selecionados como CSV local ─────────────────────────────────

  function exportarSelecionadosCSV() {
    const itens = extrato?.data.filter((i) => selecionados.has(i.id)) ?? [];
    if (itens.length === 0) return;

    const cabecalho = "ID,Pedido,Data/Hora,Cliente,Valor Bruto,Taxas,Valor Liquido,Metodo,Status";
    const linhas = itens.map((i) =>
      [
        i.id, i.publicId,
        new Date(i.dataHora).toLocaleString("pt-BR"),
        `"${i.cliente}"`,
        (i.valorBrutoCentavos / 100).toFixed(2),
        (i.taxasCentavos / 100).toFixed(2),
        (i.valorLiquidoCentavos / 100).toFixed(2),
        i.metodoPagamento, i.statusPagamento,
      ].join(",")
    );

    const csv = [cabecalho, ...linhas].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `extrato-selecionados-${toISO(new Date())}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  // ─── Ordenação por coluna ─────────────────────────────────────────────────

  function handleOrdem(col: string) {
    if (orderBy === col) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(col);
      setOrderDir("desc");
    }
    setPaginaExtrato(1);
  }

  // ─── Label do período ─────────────────────────────────────────────────────

  const labelPeriodo = `Exibindo: ${formatarData(dataFrom)} — ${formatarData(dataTo)}`;

  // ─── Totais breakdown por status (para o donut) ──────────────────────────

  const totalPedidosBreakdown = dados?.breakdownStatus.reduce((a, b) => a + b.count, 0) ?? 0;
  const totalValorBreakdown = dados?.breakdownStatus.reduce((a, b) => a + b.centavos, 0) ?? 0;

  const coresDonut: Record<string, string> = {
    pago: COR_PAGO, paid: COR_PAGO,
    pendente: COR_PENDENTE, pending: COR_PENDENTE,
    cancelado: COR_CANCELADO, cancelled: COR_CANCELADO,
    reembolsado: COR_REEMBOLSADO, refunded: COR_REEMBOLSADO,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .fin-periodo-btn {
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid var(--s6);
          background: var(--surface);
          color: var(--night);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .fin-periodo-btn:hover {
          background: var(--s8);
        }
        .fin-periodo-btn.ativo {
          background: var(--green, #2D6A4F);
          color: #fff;
          border-color: var(--green, #2D6A4F);
          font-weight: 600;
        }
        .fin-col-sort {
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }
        .fin-col-sort:hover {
          color: var(--green, #2D6A4F);
        }
        .fin-export-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          font-size: 13px;
          color: var(--night);
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          border-radius: 6px;
          transition: background 0.12s;
          font-weight: 500;
        }
        .fin-export-item:hover {
          background: var(--s8);
        }
        .fin-pg-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid var(--s6);
          background: var(--surface);
          font-size: 13px;
          color: var(--night);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.12s;
        }
        .fin-pg-btn:hover:not(:disabled) {
          background: var(--s8);
        }
        .fin-pg-btn.ativo {
          background: var(--green, #2D6A4F);
          color: #fff;
          border-color: var(--green, #2D6A4F);
        }
        .fin-pg-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <div className="wp-stack-lg">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="wp-page-header">
          <div className="wp-row-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="wp-page-title">Financeiro</h1>
              <p className="wp-page-subtitle" style={{ marginTop: 2 }}>
                {labelPeriodo}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* Dropdown exportar */}
              <div ref={exportarRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={() => setExportarAberto((v) => !v)}
                >
                  <IconeExportar />
                  Exportar
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {exportarAberto && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "var(--surface)",
                    border: "1px solid var(--s6)",
                    borderRadius: 10,
                    boxShadow: "var(--shadow-xl)",
                    padding: "6px",
                    minWidth: 230,
                    zIndex: 200,
                  }}>
                    <button
                      type="button"
                      className="fin-export-item"
                      onClick={() => {
                        setExportarAberto(false);
                        baixarCSV(
                          `/partner/financeiro/exportar?tipo=resumo&from=${dataFrom}&to=${dataTo}${statusFiltro ? `&status=${statusFiltro}` : ""}${metodoFiltro ? `&metodo=${metodoFiltro}` : ""}`,
                          `resumo-financeiro-${dataFrom}-${dataTo}.csv`,
                        );
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Exportar Resumo (CSV)
                    </button>
                    <button
                      type="button"
                      className="fin-export-item"
                      onClick={() => {
                        setExportarAberto(false);
                        baixarCSV(
                          `/partner/financeiro/exportar?tipo=completo&from=${dataFrom}&to=${dataTo}${statusFiltro ? `&status=${statusFiltro}` : ""}${metodoFiltro ? `&metodo=${metodoFiltro}` : ""}`,
                          `extrato-completo-${dataFrom}-${dataTo}.csv`,
                        );
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                      Exportar Extrato Completo (CSV)
                    </button>
                    {selecionados.size > 0 && (
                      <button
                        type="button"
                        className="fin-export-item"
                        onClick={() => {
                          setExportarAberto(false);
                          exportarSelecionadosCSV();
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        Exportar Selecionados ({selecionados.size}) (CSV)
                      </button>
                    )}
                    {/* TODO: PDF — futuro */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filtros de período ──────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {(["hoje", "7d", "15d", "30d", "mes-atual", "mes-anterior", "personalizado"] as PeriodoRapido[]).map((p) => {
            const labels: Record<PeriodoRapido, string> = {
              hoje: "Hoje", "7d": "7 dias", "15d": "15 dias", "30d": "30 dias",
              "mes-atual": "Mês atual", "mes-anterior": "Mês anterior",
              personalizado: "Personalizado",
            };
            return (
              <button
                key={p}
                type="button"
                className={`fin-periodo-btn${periodoRapido === p ? " ativo" : ""}`}
                onClick={() => aplicarPeriodoRapido(p)}
              >
                {labels[p]}
              </button>
            );
          })}

          {periodoRapido === "personalizado" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="date"
                value={dataFrom}
                onChange={(e) => { setDataFrom(e.target.value); setPaginaExtrato(1); }}
                style={{
                  border: "1px solid var(--s6)", borderRadius: 8,
                  padding: "6px 10px", fontSize: 13,
                  background: "var(--surface)", color: "var(--night)", outline: "none",
                }}
              />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>até</span>
              <input
                type="date"
                value={dataTo}
                onChange={(e) => { setDataTo(e.target.value); setPaginaExtrato(1); }}
                style={{
                  border: "1px solid var(--s6)", borderRadius: 8,
                  padding: "6px 10px", fontSize: 13,
                  background: "var(--surface)", color: "var(--night)", outline: "none",
                }}
              />
            </div>
          )}
        </div>

        {/* ── Erro principal ──────────────────────────────────────────────── */}
        {erroDados && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626",
          }}>
            {erroDados}
          </div>
        )}

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}>
          <KPICard
            label="Receita Bruta"
            icone={<IconeReceita />}
            valor={dados ? formatarCentavos(dados.kpis.receitaBruta.centavos) : "—"}
            comparacao={dados?.kpis.receitaBruta.comparacao}
            carregando={carregandoDados}
          />
          <KPICard
            label="Receita Líquida"
            icone={<IconeReceita />}
            valor={dados ? formatarCentavos(dados.kpis.receitaLiquida.centavos) : "—"}
            comparacao={dados?.kpis.receitaLiquida.comparacao}
            carregando={carregandoDados}
          />
          <KPICard
            label="Pedidos Pagos"
            icone={<IconePedidos />}
            valor={dados ? formatarCentavos(dados.kpis.pedidosPagos.centavos) : "—"}
            comparacao={dados?.kpis.pedidosPagos.comparacao}
            carregando={carregandoDados}
            extras={
              dados ? (
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                  {dados.kpis.pedidosPagos.count} pedido{dados.kpis.pedidosPagos.count !== 1 ? "s" : ""}
                </span>
              ) : undefined
            }
          />
          <KPICard
            label="Pedidos Pendentes"
            icone={<IconePedidos />}
            valor={dados ? formatarCentavos(dados.kpis.pedidosPendentes.centavos) : "—"}
            carregando={carregandoDados}
            extras={
              dados ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                    {dados.kpis.pedidosPendentes.count} pedido{dados.kpis.pedidosPendentes.count !== 1 ? "s" : ""}
                  </span>
                  {dados.kpis.pedidosPendentes.pendentesAntigoCount > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontSize: 11, color: "#d97706", fontWeight: 600,
                      background: "#fffbeb", borderRadius: 6, padding: "2px 6px",
                    }}>
                      <IconeAlerta size={11} />
                      {dados.kpis.pedidosPendentes.pendentesAntigoCount} antigo{dados.kpis.pedidosPendentes.pendentesAntigoCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              ) : undefined
            }
          />
          <KPICard
            label="Ticket Médio"
            icone={<IconeTicket />}
            valor={dados ? formatarCentavos(dados.kpis.ticketMedio.centavos) : "—"}
            comparacao={dados?.kpis.ticketMedio.comparacao}
            carregando={carregandoDados}
          />
          <KPICard
            label="Cancelamentos"
            icone={<IconePedidos />}
            valor={dados ? formatarCentavos(dados.kpis.cancelamentos.centavos) : "—"}
            comparacao={dados?.kpis.cancelamentos.comparacao}
            carregando={carregandoDados}
            extras={
              dados ? (
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                  {dados.kpis.cancelamentos.count} cancelamento{dados.kpis.cancelamentos.count !== 1 ? "s" : ""}
                </span>
              ) : undefined
            }
          />
        </div>

        {/* ── Gráficos ─────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "65fr 35fr", gap: 16 }}>

          {/* Gráfico de área */}
          <div className="wp-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid var(--s6)",
              flexWrap: "wrap", gap: 8,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--night)" }}>
                Receita por período
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {(["diario", "semanal", "mensal"] as AgregacaoGrafico[]).map((a) => {
                  const labels: Record<AgregacaoGrafico, string> = {
                    diario: "Diário", semanal: "Semanal", mensal: "Mensal",
                  };
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAgregacao(a)}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: agregacao === a ? "var(--green, #2D6A4F)" : "var(--s8)",
                        color: agregacao === a ? "#fff" : "var(--text-muted)",
                        transition: "all 0.15s",
                      }}
                    >
                      {labels[a]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "20px 8px 16px 0" }}>
              {carregandoDados ? (
                <div style={{ padding: "0 20px 0 16px" }}>
                  <Skeleton height={200} radius={6} />
                </div>
              ) : dadosGrafico.length === 0 ? (
                <div style={{
                  height: 200, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 13,
                }}>
                  Nenhum dado para exibir no período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dadosGrafico} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2D6A4F" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2D6A4F" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E07B39" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#E07B39" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--s6)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => formatarCentavosAbreviado(v * 100)}
                      width={64}
                    />
                    <Tooltip content={<TooltipArea />} />
                    <Area
                      type="monotone"
                      dataKey="totalCentavos"
                      stroke="#E07B39"
                      strokeWidth={1.5}
                      fill="url(#gradTotal)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#E07B39", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pagoCentavos"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      fill="url(#gradPago)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#2D6A4F", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legenda */}
            <div style={{
              display: "flex", gap: 16, padding: "0 20px 16px",
              flexWrap: "wrap",
            }}>
              {[
                { cor: "#2D6A4F", label: "Receita paga" },
                { cor: "#E07B39", label: "Receita total" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.cor }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut + breakdown */}
          <div className="wp-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--night)" }}>
              Breakdown
            </span>

            {carregandoDados ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton height={180} radius={8} />
                <Skeleton height={16} radius={6} />
                <Skeleton height={16} radius={6} />
              </div>
            ) : (dados?.breakdownStatus ?? []).length === 0 ? (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", fontSize: 13, minHeight: 160,
              }}>
                Sem dados no período.
              </div>
            ) : (
              <>
                {/* Donut */}
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={dados?.breakdownStatus ?? []}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {(dados?.breakdownStatus ?? []).map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={coresDonut[entry.status.toLowerCase()] ?? "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "#fff" }}
                        labelStyle={{ color: "#fff", fontWeight: 700 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Label central */}
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center", pointerEvents: "none",
                  }}>
                    <div style={{
                      fontSize: 22, fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: "var(--night)",
                      lineHeight: 1,
                    }}>
                      {totalPedidosBreakdown}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>
                      pedidos
                    </div>
                  </div>
                </div>

                {/* Legenda do donut */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(dados?.breakdownStatus ?? []).map((item) => {
                    const cor = coresDonut[item.status.toLowerCase()] ?? "#94a3b8";
                    const pct = totalPedidosBreakdown > 0
                      ? ((item.count / totalPedidosBreakdown) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <div key={item.status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--night)", fontWeight: 500, flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
                          {item.count} ({pct}%)
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif", minWidth: 70, textAlign: "right" }}>
                          {formatarCentavos(item.centavos)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Métodos de pagamento */}
                {(dados?.breakdownMetodo ?? []).length > 0 && (
                  <div style={{ borderTop: "1px solid var(--s6)", paddingTop: 12 }}>
                    <div style={{
                      fontSize: 10, color: "var(--text-muted)", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
                    }}>
                      Métodos
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(dados?.breakdownMetodo ?? []).map((item) => {
                        const pct = totalValorBreakdown > 0
                          ? (item.centavos / totalValorBreakdown) * 100
                          : 0;
                        return (
                          <div key={item.method} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "var(--night)", fontWeight: 500 }}>{item.label}</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                            <div style={{
                              height: 4, background: "var(--s6)", borderRadius: 4, overflow: "hidden",
                            }}>
                              <div style={{
                                height: "100%", width: `${pct}%`,
                                background: "var(--green, #2D6A4F)",
                                borderRadius: 4, transition: "width 0.3s ease",
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {formatarCentavos(item.centavos)} · {item.count} pedido{item.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Tabela de extrato ────────────────────────────────────────────── */}
        <div className="wp-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header da tabela */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--s6)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--night)" }}>
              Extrato de Transações
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                value={buscaExtrato}
                onChange={(e) => { setBuscaExtrato(e.target.value); setPaginaExtrato(1); }}
                placeholder="Buscar pedido ou cliente..."
                style={{
                  border: "1px solid var(--s6)", borderRadius: 8,
                  padding: "7px 12px", fontSize: 13, outline: "none",
                  background: "var(--surface)", color: "var(--night)",
                  minWidth: 200,
                }}
              />
              <select
                value={statusFiltro}
                onChange={(e) => { setStatusFiltro(e.target.value); setPaginaExtrato(1); }}
                style={{
                  border: "1px solid var(--s6)", borderRadius: 8,
                  padding: "7px 10px", fontSize: 13, outline: "none",
                  background: "var(--surface)", color: "var(--night)", cursor: "pointer",
                }}
              >
                <option value="">Todos os status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
              <select
                value={metodoFiltro}
                onChange={(e) => { setMetodoFiltro(e.target.value); setPaginaExtrato(1); }}
                style={{
                  border: "1px solid var(--s6)", borderRadius: 8,
                  padding: "7px 10px", fontSize: 13, outline: "none",
                  background: "var(--surface)", color: "var(--night)", cursor: "pointer",
                }}
              >
                <option value="">Todos os métodos</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
              </select>
            </div>
          </div>

          {/* Corpo */}
          {carregandoExtrato ? (
            <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={36} radius={6} />
              ))}
            </div>
          ) : erroExtrato ? (
            <div style={{ padding: 20 }}>
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626",
              }}>
                {erroExtrato}
              </div>
            </div>
          ) : !extrato || extrato.data.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "64px 0",
              color: "var(--text-muted)", fontSize: 14,
            }}>
              Nenhuma transação encontrada no período.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="wp-table" style={{ borderRadius: 0, minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={todosSelecionadosNaPagina}
                        onChange={toggleSelecionarTodos}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    {[
                      { key: "dataHora", label: "Data/Hora" },
                      { key: "publicId", label: "Pedido" },
                      { key: "cliente", label: "Cliente" },
                      { key: "valorBruto", label: "Valor Bruto" },
                      { key: "taxas", label: "Taxas" },
                      { key: "valorLiquido", label: "Valor Líquido" },
                      { key: "metodo", label: "Forma de Pgto" },
                      { key: "status", label: "Status" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="fin-col-sort"
                        onClick={() => handleOrdem(col.key)}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          <IconeOrdenar ativo={orderBy === col.key} dir={orderBy === col.key ? orderDir : "desc"} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extrato.data.map((item) => (
                    <tr
                      key={item.id}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        if ((e.target as HTMLInputElement).type === "checkbox") return;
                        setPedidoDrawer(item);
                      }}
                    >
                      <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selecionados.has(item.id)}
                          onChange={() => toggleSelecionado(item.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {formatarDataHora(item.dataHora)}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 13, fontWeight: 700, color: "var(--night)",
                        }}>
                          {item.publicId}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--night)" }}>
                        {item.cliente || "—"}
                      </td>
                      <td style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13, fontWeight: 600, color: "var(--night)",
                      }}>
                        {formatarCentavos(item.valorBrutoCentavos)}
                      </td>
                      <td style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13, color: "var(--text-muted)",
                      }}>
                        {formatarCentavos(item.taxasCentavos)}
                      </td>
                      <td style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13, fontWeight: 700, color: "var(--night)",
                      }}>
                        {formatarCentavos(item.valorLiquidoCentavos)}
                      </td>
                      <td style={{ fontSize: 13, color: "var(--night)" }}>
                        {item.metodoPagamento}
                      </td>
                      <td>
                        <BadgeStatus status={item.statusPagamento} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer da tabela */}
          {extrato && extrato.data.length > 0 && (
            <div style={{
              padding: "12px 20px", borderTop: "1px solid var(--s6)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 10,
            }}>
              {/* Totais */}
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>
                  Total da página:{" "}
                  <strong style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--night)" }}>
                    {formatarCentavos(extrato.data.reduce((s, i) => s + i.valorLiquidoCentavos, 0))}
                  </strong>
                </span>
                <span>
                  Total geral:{" "}
                  <strong style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--night)" }}>
                    {formatarCentavos(extrato.totalFiltradoCentavos)}
                  </strong>
                </span>
                <span>
                  {extrato.total} registro{extrato.total !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Paginação */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  type="button"
                  className="fin-pg-btn"
                  disabled={paginaExtrato === 1}
                  onClick={() => setPaginaExtrato((p) => p - 1)}
                >
                  ‹
                </button>
                {(() => {
                  const totalPgs = Math.ceil(extrato.total / extrato.pageSize);
                  const pgs: number[] = [];
                  for (let p = Math.max(1, paginaExtrato - 2); p <= Math.min(totalPgs, paginaExtrato + 2); p++) {
                    pgs.push(p);
                  }
                  return pgs.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`fin-pg-btn${p === paginaExtrato ? " ativo" : ""}`}
                      onClick={() => setPaginaExtrato(p)}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  type="button"
                  className="fin-pg-btn"
                  disabled={paginaExtrato >= Math.ceil(extrato.total / extrato.pageSize)}
                  onClick={() => setPaginaExtrato((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Drawer de pedido */}
      <DrawerPedido
        pedido={pedidoDrawer}
        onClose={() => setPedidoDrawer(null)}
      />
    </>
  );
}
