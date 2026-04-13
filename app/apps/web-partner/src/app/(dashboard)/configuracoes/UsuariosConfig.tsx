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

const ROLE_BADGE_STYLE: Record<string, React.CSSProperties> = {
  owner: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  manager: {
    background: "var(--green-soft)",
    color: "var(--green)",
    border: "1px solid #a7d9c8",
  },
  operator: { background: "#f4f4f5", color: "#52525b", border: "1px solid #e4e4e7" },
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

      {mostrarConvite && (
        <form
          onSubmit={handleConvidar}
          style={{
            background: "var(--cream)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--night)",
              marginBottom: 12,
            }}
          >
            Novo convite
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <div className="wp-field" style={{ margin: 0 }}>
              <label className="wp-label" htmlFor="emailConvite">
                E-mail
              </label>
              <input
                id="emailConvite"
                className="wp-input"
                type="email"
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                placeholder="email@exemplo.com"
                autoComplete="off"
              />
            </div>
            <div className="wp-field" style={{ margin: 0 }}>
              <label className="wp-label" htmlFor="roleConvite">
                Perfil
              </label>
              <select
                id="roleConvite"
                className="wp-input"
                value={roleConvite}
                onChange={(e) => setRoleConvite(e.target.value)}
                style={{ minWidth: 130 }}
              >
                <option value="manager">Gerente</option>
                <option value="operator">Operador</option>
              </select>
            </div>
            <div style={{ paddingBottom: 1 }}>
              <button
                type="submit"
                className="wp-btn wp-btn-primary"
                disabled={convidando}
                style={{ opacity: convidando ? 0.7 : 1 }}
              >
                {convidando ? "Enviando..." : "Convidar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {feedback && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            background: feedback.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${feedback.ok ? "#bbf7d0" : "#fecaca"}`,
            color: feedback.ok ? "#15803d" : "#dc2626",
          }}
        >
          {feedback.msg}
        </div>
      )}

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
            const badgeStyle = ROLE_BADGE_STYLE[u.role] ?? ROLE_BADGE_STYLE.operator;
            const confirmando = confirmarRevogacaoId === u.id;

            return (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "var(--blue)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
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
                            color: "var(--text-muted)",
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
                <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{u.user.email}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      ...badgeStyle,
                    }}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
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
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: 6,
                              color: "#dc2626",
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
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              color: "var(--text-muted)",
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
                            <summary
                              style={{
                                listStyle: "none",
                                cursor: "pointer",
                                padding: "6px 8px",
                                borderRadius: 6,
                                background: "none",
                                border: "1px solid var(--border)",
                                color: "var(--text-muted)",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
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
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: 4,
                                minWidth: 140,
                                zIndex: 100,
                                boxShadow: "0 4px 16px rgba(0,0,0,.12)",
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
                                  color: "#dc2626",
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
                style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}
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
