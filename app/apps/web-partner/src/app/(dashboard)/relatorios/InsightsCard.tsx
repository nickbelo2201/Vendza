"use client";

type RevenueByDay = { date: string; revenueCents: number };
type PaymentDistribution = { method: string; count: number };
type SalesByHour = { hour: number; count: number; revenueCents: number };

type Relatorio = {
  totalOrders: number;
  totalRevenueCents: number;
  averageTicketCents: number;
  newCustomers: number;
  revenueByDay: RevenueByDay[];
  topProducts: { name: string; quantity: number; revenueCents: number }[];
  cancelledOrders: number;
  cancellationRate: number;
  repeatCustomers: number;
  repeatRate: number;
  paymentDistribution: PaymentDistribution[];
  salesByHour: SalesByHour[];
};

type Props = {
  relatorio: Relatorio | null;
};

type Insight = {
  id: string;
  texto: string;
};

const DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function gerarInsights(relatorio: Relatorio): Insight[] {
  const insights: Insight[] = [];

  // Insight 1: hora pico
  if (relatorio.salesByHour.length > 0) {
    const horaPico = relatorio.salesByHour.reduce((prev, curr) =>
      curr.count > prev.count ? curr : prev
    );
    if (horaPico.count > 0) {
      insights.push({
        id: "hora-pico",
        texto: `Seu pico de vendas é às ${String(horaPico.hour).padStart(2, "0")}h — considere reforçar a equipe neste horário.`,
      });
    }
  }

  // Insight 2: método de pagamento dominante
  if (relatorio.paymentDistribution.length > 0) {
    const totalPagamentos = relatorio.paymentDistribution.reduce((acc, p) => acc + p.count, 0);
    if (totalPagamentos > 0) {
      const dominante = relatorio.paymentDistribution.reduce((prev, curr) =>
        curr.count > prev.count ? curr : prev
      );
      const pct = ((dominante.count / totalPagamentos) * 100).toFixed(0);
      const metodLabel =
        dominante.method === "pix"
          ? "PIX"
          : dominante.method === "cash"
          ? "Dinheiro"
          : dominante.method === "card_on_delivery"
          ? "Cartão na entrega"
          : dominante.method === "card_online"
          ? "Cartão online"
          : dominante.method;

      if (dominante.method === "pix") {
        insights.push({
          id: "pagamento-dominante",
          texto: `PIX representa ${pct}% dos pagamentos — considere oferecer desconto PIX para aumentar conversões.`,
        });
      } else {
        insights.push({
          id: "pagamento-dominante",
          texto: `${metodLabel} representa ${pct}% dos pagamentos — o método preferido dos seus clientes.`,
        });
      }
    }
  }

  // Insight 3: melhor dia da semana
  if (relatorio.revenueByDay.length > 0) {
    const melhorDia = relatorio.revenueByDay.reduce((prev, curr) =>
      curr.revenueCents > prev.revenueCents ? curr : prev
    );
    if (melhorDia.revenueCents > 0) {
      const diaSemana = new Date(melhorDia.date + "T00:00:00").getDay();
      const nomeDia = DIAS_SEMANA[diaSemana] ?? "este dia";
      insights.push({
        id: "melhor-dia",
        texto: `${nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1)} foi seu melhor dia com ${formatarReais(melhorDia.revenueCents)} em faturamento.`,
      });
    }
  }

  // Insight 4: taxa de cancelamento alta
  if (relatorio.cancellationRate > 10) {
    insights.push({
      id: "cancelamento",
      texto: `Taxa de cancelamento em ${relatorio.cancellationRate.toFixed(1)}% — verifique as causas mais frequentes para reduzir perdas.`,
    });
  }

  // Insight 5: clientes recorrentes
  if (relatorio.repeatCustomers > 0) {
    insights.push({
      id: "recorrentes",
      texto: `${relatorio.repeatCustomers} cliente${relatorio.repeatCustomers !== 1 ? "s são" : " é"} recorrente${relatorio.repeatCustomers !== 1 ? "s" : ""} neste período — considere criar um programa de fidelidade.`,
    });
  }

  return insights.slice(0, 5);
}

function IconeInsight({ tamanho = 16 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

export function InsightsCard({ relatorio }: Props) {
  if (!relatorio) return null;

  const insights = gerarInsights(relatorio);

  if (insights.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--gl, #e8f5f0)",
        border: "1px solid var(--g, #1A7A5E)",
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          color: "var(--g, #1A7A5E)",
        }}
      >
        <IconeInsight tamanho={18} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--g, #1A7A5E)",
            letterSpacing: "0.01em",
          }}
        >
          Insights do período
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            background: "var(--g, #1A7A5E)",
            color: "#fff",
            borderRadius: 20,
            padding: "2px 8px",
          }}
        >
          {insights.length}
        </span>
      </div>

      {/* Lista de insights */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {insights.map((insight) => (
          <li
            key={insight.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                marginTop: 1,
                color: "var(--g, #1A7A5E)",
                opacity: 0.7,
              }}
            >
              <IconeInsight tamanho={13} />
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--carbon, #1A1A2E)",
                lineHeight: 1.5,
              }}
            >
              {insight.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
