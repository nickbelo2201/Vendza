export default function ConfiguracoesLoading() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 0.9; }
          100% { opacity: 0.6; }
        }

        .skeleton-line {
          height: 20px;
          background: var(--border);
          border-radius: 8px;
          margin-bottom: 12px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-line-short {
          height: 16px;
          width: 60%;
          background: var(--border);
          border-radius: 6px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-block {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .skeleton-heading {
          height: 28px;
          width: 200px;
          background: var(--border);
          border-radius: 8px;
          margin-bottom: 12px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-input {
          height: 44px;
          background: var(--border);
          border-radius: 8px;
          margin-bottom: 16px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .skeleton-2col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="wp-stack-lg">
        <div className="wp-page-header">
          <h1>Configurações</h1>
          <p>Gerencie os dados, horários, conta bancária e usuários da loja.</p>
        </div>

        <div className="conf-layout" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <div style={{ display: "none" }} />

          <div className="wp-stack-lg" style={{ flex: 1, minWidth: 0 }}>
            <div className="skeleton-block">
              <div className="skeleton-heading" />
              <div className="skeleton-line-short" style={{ marginBottom: 24 }} />
              <div className="skeleton-2col">
                <div>
                  <div className="skeleton-line-short" style={{ marginBottom: 8 }} />
                  <div className="skeleton-input" />
                </div>
                <div>
                  <div className="skeleton-line-short" style={{ marginBottom: 8 }} />
                  <div className="skeleton-input" />
                </div>
              </div>
              <div style={{ height: 44, background: "var(--border)", borderRadius: 8, animation: "shimmer 1.5s infinite" }} />
            </div>

            <div className="skeleton-block">
              <div className="skeleton-heading" />
              <div className="skeleton-line-short" style={{ marginBottom: 24 }} />
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-2col" style={{ marginBottom: 16 }}>
                  <div className="skeleton-input" />
                  <div className="skeleton-input" />
                </div>
              ))}
            </div>

            <div className="skeleton-block">
              <div className="skeleton-heading" />
              <div className="skeleton-line-short" style={{ marginBottom: 24 }} />
              <div className="skeleton-input" />
              <div className="skeleton-input" />
            </div>

            <div className="skeleton-block">
              <div className="skeleton-heading" />
              <div style={{ height: 400, background: "var(--border)", borderRadius: 8, animation: "shimmer 1.5s infinite", marginBottom: 16 }} />
            </div>

            <div className="skeleton-block">
              <div className="skeleton-heading" />
              {[1, 2].map((i) => (
                <div key={i} style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12 }}>
                  <div className="skeleton-line-short" style={{ marginBottom: 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
