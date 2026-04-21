"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchAPI, ApiError } from "../../../lib/api";

/* ══════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════ */
type StatusInvite = "idle" | "processing" | "success" | "error";

interface InviteResponse {
  message?: string;
}

/* ══════════════════════════════════════════════════════════════
   ÍCONE SVG — CHECKMARK
══════════════════════════════════════════════════════════════ */
function CheckmarkIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   ÍCONE SVG — X/ERRO
══════════════════════════════════════════════════════════════ */
function ErrorIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   ÍCONE SVG — CARREGANDO (SPINNER)
══════════════════════════════════════════════════════════════ */
function LoadingIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        animation: "spin 1s linear infinite",
      }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0 0 20" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function AceitarConvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<StatusInvite>("idle");
  const [message, setMessage] = useState("");

  /* ─────────────────────────────────────────────────────────────
     Validar token ao carregar a página
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token não fornecido. Verifique o link do convite.");
    }
  }, [token]);

  /* ─────────────────────────────────────────────────────────────
     Handler para o botão "Aceitar Convite"
     POST com token no body para evitar exposição em logs/referer
  ───────────────────────────────────────────────────────────── */
  const handleAcceptInvite = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Token não disponível. Recarregue a página.");
      return;
    }

    setStatus("processing");
    setMessage("Processando seu convite...");

    try {
      const result = await fetchAPI<InviteResponse>(
        "/partner/aceitar-convite",
        {
          method: "POST",
          body: JSON.stringify({ token }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setStatus("success");
      setMessage("Convite aceito com sucesso! Redirecionando para login...");

      /* Redirecionar após 2 segundos */
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      let errorMessage = "Erro ao processar convite. Tente novamente.";

      if (err instanceof ApiError) {
        if (err.status === 400) {
          errorMessage = "Token inválido ou expirado.";
        } else if (err.status === 404) {
          errorMessage = "Convite não encontrado.";
        } else if (err.status === 410) {
          errorMessage = "Este convite já foi utilizado.";
        }
      }

      setStatus("error");
      setMessage(errorMessage);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--cream)", padding: "20px" }}>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .wp-invite-card {
          background: var(--surface);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
          padding: 40px;
          max-width: 450px;
          width: 100%;
          text-align: center;
        }

        .wp-invite-icon-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          color: var(--carbon);
        }

        .wp-invite-icon-container.success {
          color: var(--green);
        }

        .wp-invite-icon-container.error {
          color: var(--amber);
        }

        .wp-invite-icon-container.processing {
          color: var(--text-muted);
        }

        .wp-invite-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--carbon);
          margin-bottom: 12px;
          font-family: "Inter", sans-serif;
        }

        .wp-invite-message {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 32px;
          font-family: "Inter", sans-serif;
        }

        .wp-invite-button {
          display: inline-block;
          background: var(--green);
          color: var(--surface);
          border: none;
          border-radius: var(--radius-sm);
          padding: 12px 32px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, opacity 0.2s ease;
          font-family: "Inter", sans-serif;
        }

        .wp-invite-button:hover:not(:disabled) {
          background: var(--green-hover, #245a45);
        }

        .wp-invite-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .wp-invite-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wp-invite-button-secondary {
          display: inline-block;
          background: transparent;
          color: var(--green);
          border: 1px solid var(--green);
          border-radius: var(--radius-sm);
          padding: 12px 32px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "Inter", sans-serif;
          margin-left: 12px;
        }

        .wp-invite-button-secondary:hover {
          background: var(--green);
          color: var(--surface);
        }

        .wp-invite-button-group {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 480px) {
          .wp-invite-card {
            padding: 32px 20px;
          }

          .wp-invite-title {
            font-size: 20px;
          }

          .wp-invite-button-group {
            flex-direction: column;
          }

          .wp-invite-button-secondary {
            margin-left: 0;
          }
        }
      `}</style>

      <div className="wp-invite-card">
        {/* ESTADO OCIOSO - Aguardando ação do usuário */}
        {status === "idle" && token && (
          <>
            <div className="wp-invite-icon-container">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="wp-invite-title">Aceitar convite</h1>
            <p className="wp-invite-message">
              Clique no botão abaixo para aceitar o convite e criar sua conta.
            </p>
            <div className="wp-invite-button-group">
              <button
                className="wp-invite-button"
                onClick={handleAcceptInvite}
                disabled={status !== "idle"}
              >
                Aceitar convite
              </button>
            </div>
          </>
        )}

        {/* PROCESSANDO */}
        {status === "processing" && (
          <>
            <div className="wp-invite-icon-container processing">
              <LoadingIcon />
            </div>
            <h1 className="wp-invite-title">Processando convite</h1>
            <p className="wp-invite-message">{message}</p>
          </>
        )}

        {/* SUCESSO */}
        {status === "success" && (
          <>
            <div className="wp-invite-icon-container success">
              <CheckmarkIcon />
            </div>
            <h1 className="wp-invite-title">Convite aceito!</h1>
            <p className="wp-invite-message">{message}</p>
          </>
        )}

        {/* ERRO */}
        {status === "error" && (
          <>
            <div className="wp-invite-icon-container error">
              <ErrorIcon />
            </div>
            <h1 className="wp-invite-title">Algo deu errado</h1>
            <p className="wp-invite-message">{message}</p>
            <div className="wp-invite-button-group">
              {token && (
                <button
                  className="wp-invite-button"
                  onClick={handleAcceptInvite}
                  disabled={status !== "error"}
                >
                  Tentar novamente
                </button>
              )}
              <button className="wp-invite-button-secondary" onClick={() => router.push("/login")}>
                Ir para login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
