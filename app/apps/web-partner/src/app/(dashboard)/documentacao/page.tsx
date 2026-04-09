import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentação — Vendza",
};

export default function DocumentacaoPage() {
  return (
    <div className="wp-page-content">
      <div className="wp-page-header">
        <h1 className="wp-page-title">Documentação</h1>
      </div>

      <div className="wp-panel" style={{ maxWidth: 640, padding: "48px 40px", textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--v2-text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--v2-text-main)",
            marginBottom: 12,
          }}
        >
          Em breve
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--v2-text-muted)",
            lineHeight: 1.6,
          }}
        >
          Nossa documentacao esta em analise e sera disponibilizada em breve.
        </p>
      </div>
    </div>
  );
}
