import { Suspense } from "react";
import { ConfigNavLateral } from "./ConfigNavLateral";
import {
  SettingsSuspenseWrapper,
  SettingsSection,
  HorariosSection,
  ContaBancariaSection,
  ZonasSection,
  UsuariosSection,
} from "./SuspenseWrappers";

function SkeletonFallback() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 24,
      marginBottom: 24,
    }}>
      <div style={{
        height: 20,
        background: "var(--border)",
        borderRadius: 8,
        marginBottom: 16,
        animation: "shimmer 1.5s infinite",
      }} />
      <div style={{
        height: 44,
        background: "var(--border)",
        borderRadius: 8,
        animation: "shimmer 1.5s infinite",
      }} />
    </div>
  );
}

export default async function SettingsPage() {
  return (
    <>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 0.9; }
          100% { opacity: 0.6; }
        }

        /* Tablet: 768px - 1200px */
        @media (max-width: 1200px) {
          .conf-layout {
            flex-direction: column !important;
          }
          .conf-nav-lateral {
            display: none !important;
          }
          .conf-nav-dropdown {
            display: block !important;
            margin-bottom: 16px;
          }
          .conf-2col {
            grid-template-columns: 1fr !important;
          }
          .conf-mapa-layout {
            flex-direction: column !important;
            height: auto !important;
          }
          .conf-mapa-map {
            flex: none !important;
            height: 300px !important;
            width: 100% !important;
          }
          .conf-mapa-panel {
            flex: none !important;
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--border) !important;
          }
        }

        /* Mobile: < 768px */
        @media (max-width: 768px) {
          .conf-input {
            min-height: 44px !important;
          }
          .conf-btn-save {
            position: sticky;
            bottom: 0;
            z-index: 10;
            width: 100%;
            padding: 12px 16px;
            background: var(--surface);
            border-top: 1px solid var(--border);
            margin: 0 -20px;
          }
        }

        /* Dropdown da nav — oculto por padrão (desktop) */
        .conf-nav-dropdown {
          display: none;
        }
      `}</style>

      <div className="wp-stack-lg">
        <div className="wp-page-header">
          <h1>Configurações</h1>
          <p>Gerencie os dados, horários, conta bancária e usuários da loja.</p>
        </div>

        <div className="conf-layout" style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Nav lateral sticky — desktop */}
          <ConfigNavLateral />

          {/* Cards com Suspense boundaries independentes */}
          <div className="wp-stack-lg" style={{ flex: 1, minWidth: 0 }}>
            <Suspense fallback={<SkeletonFallback />}>
              <SettingsSection />
            </Suspense>

            <Suspense fallback={<SkeletonFallback />}>
              <HorariosSection />
            </Suspense>

            <Suspense fallback={<SkeletonFallback />}>
              <ContaBancariaSection />
            </Suspense>

            <Suspense fallback={<SkeletonFallback />}>
              <ZonasSection />
            </Suspense>

            <Suspense fallback={<SkeletonFallback />}>
              <UsuariosSection />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
