export default function RelatoriosPage() {
  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <h1>Relatórios</h1>
        <p>Análises de vendas, desempenho e tendências da sua loja.</p>
      </div>

      <div className="wp-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="wp-empty">
          <span className="wp-empty-icon">📊</span>
          <p className="wp-empty-title">Relatórios em desenvolvimento</p>
          <p className="wp-empty-desc">
            Esta funcionalidade estará disponível na próxima versão do painel.
            Por enquanto, consulte a página de Pedidos para acompanhar seu desempenho.
          </p>
        </div>
      </div>
    </div>
  );
}
