/* ─────────────────────────────────────────────────────────
   Dashboard V2 — Visão Geral
   Dados: stub estático (meta.stub: true) até API conectar
───────────────────────────────────────────────────────── */

/* ── Sparkline SVG inline ── */
function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg
      className="metric-sparkline"
      viewBox="0 0 120 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <polyline
        points={`${points} 120,40 0,40`}
        fill={color}
        opacity="0.08"
        stroke="none"
      />
    </svg>
  );
}

/* ── Ícone triângulo de alerta ── */
function IconAlert({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* ── Ícone estrela ── */
function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

/* ── Dados estáticos (stub) ── */
const metricCards = [
  {
    label: "Pedidos hoje",
    value: "150",
    accent: "#0052CC",
    sparklinePoints: "0,35 20,30 40,28 60,20 80,15 100,10 120,6",
    delta: "+12% vs ontem",
  },
  {
    label: "Faturamento",
    value: "R$ 8.500",
    accent: "#FF6B35",
    sparklinePoints: "0,38 20,32 40,30 60,22 80,18 100,12 120,8",
    delta: "+15% vs ontem",
  },
  {
    label: "Ticket médio",
    value: "R$ 56,70",
    accent: "#2D5A3D",
    sparklinePoints: "0,32 20,28 40,30 60,24 80,22 100,18 120,16",
    delta: "+5% vs ontem",
  },
  {
    label: "Clientes recorrentes",
    value: "45%",
    accent: "#9CA3AF",
    sparklinePoints: "0,28 20,26 40,28 60,25 80,24 100,22 120,21",
    delta: "+2% vs ontem",
  },
];

const kanbanCols = [
  {
    label: "A Fazer",
    items: [
      { id: "PED-1024", cliente: "Maria S.", tempo: "10 min" },
      { id: "PED-1025", cliente: "João P.",  tempo: "35 min" },
      { id: "PED-1026", cliente: "Carlos M.", tempo: "25 min" },
    ],
  },
  {
    label: "Em Progresso",
    items: [
      { id: "PED-1027", cliente: "Ana L.",   tempo: "15 min" },
      { id: "PED-1028", cliente: "Mara S.",  tempo: "20 min" },
      { id: "PED-1029", cliente: "João S.",  tempo: "25 min" },
    ],
  },
  {
    label: "Concluído",
    items: [
      { id: "PED-1020", cliente: "João P.",  tempo: "30 min" },
      { id: "PED-1021", cliente: "Rita S.",  tempo: "35 min" },
    ],
  },
];

const estoqueItens = [
  {
    nome: "Heineken 600ml",
    qty: "3 un. restantes",
    barColor: "#EF4444",
    barWidth: "12%",
    alertColor: "#EF4444",
  },
  {
    nome: "Vinho Miolo Merlot",
    qty: "8 un. restantes",
    barColor: "#F59E0B",
    barWidth: "32%",
    alertColor: "#F59E0B",
  },
];

export default function PartnerHomePage() {
  return (
    <div>
      {/* ── Metric Cards ── */}
      <div className="metric-grid">
        {metricCards.map((card) => (
          <div key={card.label} className="metric-card">
            <div className="metric-accent" style={{ background: card.accent }} />
            <span className="metric-label">{card.label}</span>
            <span className="metric-value">{card.value}</span>
            <Sparkline points={card.sparklinePoints} color={card.accent} />
            <span className="metric-delta">{card.delta}</span>
          </div>
        ))}
      </div>

      {/* ── Linha inferior ── */}
      <div className="dashboard-bottom">
        {/* Kanban */}
        <div className="kanban-card">
          <div className="kanban-header">Pedidos em Andamento</div>
          <div className="kanban-grid">
            {kanbanCols.map((col) => (
              <div key={col.label}>
                <div className="kanban-col-label">{col.label}</div>
                {col.items.map((item) => (
                  <div key={item.id} className="kanban-item">
                    <span className="kanban-item-id">{item.id}: {item.cliente}</span>
                    <span className="kanban-item-sub">{item.tempo}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Side cards */}
        <div className="side-cards">
          {/* Estoque Crítico */}
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Estoque Crítico</span>
              <span className="side-card-tag">Alerta IA</span>
            </div>
            {estoqueItens.map((item) => (
              <div key={item.nome} className="stock-item">
                <div className="stock-item-row">
                  <span className="stock-item-name">{item.nome}</span>
                  <IconAlert color={item.alertColor} />
                </div>
                <span className="stock-item-qty">{item.qty}</span>
                <div className="stock-bar-track">
                  <div
                    className="stock-bar-fill"
                    style={{ width: item.barWidth, background: item.barColor }}
                  />
                </div>
              </div>
            ))}
            <div className="stock-footer">
              <a href="/catalogo" className="stock-footer-link">Ver estoque completo →</a>
            </div>
          </div>

          {/* Próxima Ação Recomendada */}
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Próxima Ação Recomendada</span>
              <span className="side-card-tag">AI Action</span>
            </div>
            <div className="action-card-body">
              <p className="action-card-text">
                Repor Heineken 600ml antes do pico das 18h — fornecedor com entrega disponível hoje.
              </p>
              <button className="action-btn" type="button">
                <IconStar />
                Executar Ação
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
