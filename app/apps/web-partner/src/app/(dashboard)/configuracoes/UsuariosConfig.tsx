"use client";

import { useState } from "react";

import { convidarUsuario, revogarUsuario } from "./actions";

type UsuarioStore = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type Props = {
  usuarios: UsuarioStore[];
  currentUserId: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  operator: "Operador",
};

/* Gradientes de avatar por papel */
const AVATAR_GRADIENT: Record<string, string> = {
  owner: "linear-gradient(135deg, #1A7A5E, #15a87c)",
  manager: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  operator: "linear-gradient(135deg, #64748b, #94a3b8)",
};

/* Estilos dos role badges — fundo translúcido, borda colorida, dot */
const ROLE_BADGE: Record<
  string,
  { background: string; border: string; color: string; dot: string }
> = {
  owner: {
    background: "rgba(26, 122, 94, 0.15)",
    border: "1px solid rgba(26, 122, 94, 0.3)",
    color: "#4ade80",
    dot: "#4ade80",
  },
  manager: {
    background: "rgba(59, 130, 246, 0.15)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    color: "#60a5fa",
    dot: "#60a5fa",
  },
  operator: {
    background: "rgba(148, 163, 184, 0.15)",
    border: "1px solid rgba(148, 163, 184, 0.3)",
    color: "#94a3b8",
    dot: "#94a3b8",
  },
};

function getIniciais(name: string | null, email: string): string {
  if (name) {
    const partes = name.trim().split(" ");
    if (partes.length >= 2) {
      return ((partes[0]?.[0] ?? "") + (partes[partes.length - 1]?.[0] ?? "")).toUpperCase();
    }
    return (name[0] ?? "").toUpperCase();
  }
  return (email[0] ?? "").toUpperCase();
}

export function UsuariosConfig({ usuarios: usuariosProp, currentUserId }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioStore[]>(usuariosProp);
  const [mostrarConvite, setMostrarConvite] = useState(false);
  const [emailConvite, setEmailConvite] = useState("");
  const [roleConvite, setRoleConvite] = useState("operator");
  const [convidando, setConvidando] = useState(false);
  const [revogando, setRevogando] = useState<string | null>(null);
  const [confirmarRevogacaoId, setConfirmarRevogacaoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailConvite.trim()) {
      setFeedback({ ok: false, msg: "Informe o e-mail do usuário." });
      return;
    }
    setConvidando(true);
    setFeedback(null);
    try {
      await convidarUsuario({ email: emailConvite.trim(), role: roleConvite });
      setFeedback({ ok: true, msg: `Convite enviado para ${emailConvite.trim()}.` });
      setEmailConvite("");
      setRoleConvite("operator");
      setMostrarConvite(false);
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : "Erro ao enviar convite.",
      });
    } finally {
      setConvidando(false);
    }
  }

  async function handleRevogar(storeUserId: string) {
    setRevogando(storeUserId);
    setFeedback(null);
    setConfirmarRevogacaoId(null);
    try {
      await revogarUsuario(storeUserId);
      setUsuarios((prev) => prev.filter((u) => u.id !== storeUserId));
      setFeedback({ ok: true, msg: "Acesso revogado com sucesso." });
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : "Erro ao revogar acesso.",
      });
    } finally {
      setRevogando(null);
    }
  }

  return (
    <div className="wp-panel">
      {/* Cabeçalho do painel */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Usuários com acesso</h2>
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          onClick={() => {
            setMostrarConvite((v) => !v);
            setFeedback(null);
          }}
          style={{ fontSize: 13, padding: "8px 14px" }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ marginRight: 6, verticalAlign: "middle" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Convidar usuário
        </button>
      </div>

      {/* Formulário de convite */}
      {mostrarConvite && (
        <form
          onSubmit={handleConvidar}
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          {/* Label de seção */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--dark-text-muted, #64748B)",
              marginBottom: 14,
            }}
          >
            Convidar por e-mail
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            {/* Campo e-mail com ícone de envelope */}
            <div className="wp-field" style={{ margin: 0 }}>
              <label
                className="wp-label"
                htmlFor="emailConvite"
                style={{ color: "var(--dark-text-sec, #94A3B8)", fontSize: 12, fontWeight: 600 }}
              >
                E-mail
              </label>
              <div className="uc-input-wrapper">
                {/* Ícone de envelope inline */}
                <span className="uc-input-icon" aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="emailConvite"
                  className="uc-input-dark"
                  type="email"
                  value={emailConvite}
                  onChange={(e) => setEmailConvite(e.target.value)}
                  placeholder="email@exemplo.com"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Select de perfil */}
            <div className="wp-field" style={{ margin: 0 }}>
              <label
                className="wp-label"
                htmlFor="roleConvite"
                style={{ color: "var(--dark-text-sec, #94A3B8)", fontSize: 12, fontWeight: 600 }}
              >
                Perfil
              </label>
              <select
                id="roleConvite"
                className="uc-select-dark"
                value={roleConvite}
                onChange={(e) => setRoleConvite(e.target.value)}
                style={{ minWidth: 130 }}
              >
                <option value="manager">Gerente</option>
                <option value="operator">Operador</option>
              </select>
            </div>

            {/* Botão Convidar */}
            <div style={{ paddingBottom: 1 }}>
              <button
                type="submit"
                className="uc-btn-invite"
                disabled={convidando}
              >
                {convidando ? "Enviando..." : "Convidar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Feedback de operação */}
      {feedback && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            background: feedback.ok
              ? "rgba(26, 122, 94, 0.12)"
              : "rgba(220, 38, 38, 0.10)",
            border: `1px solid ${feedback.ok ? "rgba(26, 122, 94, 0.3)" : "rgba(220, 38, 38, 0.3)"}`,
            color: feedback.ok ? "#4ade80" : "#f87171",
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Tabela de usuários */}
      <table className="wp-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th style={{ width: 120 }}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const isMe = u.userId === currentUserId;
            const badge = ROLE_BADGE[u.role] ?? {
              background: "rgba(148, 163, 184, 0.15)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#94a3b8",
              dot: "#94a3b8",
            };
            const avatarGradient =
              AVATAR_GRADIENT[u.role] ?? "linear-gradient(135deg, #64748b, #94a3b8)";
            const confirmando = confirmarRevogacaoId === u.id;

            return (
              <tr key={u.id} className="uc-table-row">
                {/* Coluna: nome + avatar */}
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: avatarGradient,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {getIniciais(u.user.name, u.user.email)}
                    </div>
                    <span style={{ fontWeight: 500 }}>
                      {u.user.name ?? "—"}
                      {isMe && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--dark-text-muted, #64748B)",
                            marginLeft: 8,
                            fontWeight: 400,
                          }}
                        >
                          (você)
                        </span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Coluna: e-mail em monospace */}
                <td
                  style={{
                    color: "var(--dark-text-sec, #94A3B8)",
                    fontSize: 13,
                    fontFamily: "'Space Grotesk', 'JetBrains Mono', monospace",
                  }}
                >
                  {u.user.email}
                </td>

                {/* Coluna: badge de role */}
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "3px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: badge.background,
                      border: badge.border,
                      color: badge.color,
                    }}
                  >
                    {/* Dot indicator */}
                    <span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: badge.dot,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>

                {/* Coluna: ações */}
                <td>
                  {!isMe && (
                    <>
                      {confirmando ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRevogar(u.id)}
                            disabled={revogando === u.id}
                            style={{
                              background: "rgba(220, 38, 38, 0.12)",
                              border: "1px solid rgba(220, 38, 38, 0.3)",
                              borderRadius: 6,
                              color: "#f87171",
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "4px 10px",
                              cursor: "pointer",
                            }}
                          >
                            {revogando === u.id ? "..." : "Confirmar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmarRevogacaoId(null)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: 6,
                              color: "var(--dark-text-muted, #64748B)",
                              fontSize: 12,
                              padding: "4px 8px",
                              cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <details style={{ position: "relative" }}>
                            <summary className="uc-action-btn">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                              </svg>
                            </summary>
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                background: "var(--dark-surface-solid, #1e293b)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: 8,
                                padding: 4,
                                minWidth: 140,
                                zIndex: 100,
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setConfirmarRevogacaoId(u.id)}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                  background: "none",
                                  border: "none",
                                  padding: "8px 12px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 13,
                                  color: "#f87171",
                                  fontWeight: 500,
                                }}
                              >
                                Remover acesso
                              </button>
                            </div>
                          </details>
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {usuarios.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: "center",
                  color: "var(--dark-text-muted, #64748B)",
                  padding: 24,
                }}
              >
                Nenhum usuário encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
