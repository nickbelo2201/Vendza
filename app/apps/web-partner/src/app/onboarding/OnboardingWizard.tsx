"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "../../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/* ─── Ícones SVG inline ─── */

function IconoEnvelope() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconoX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconoLoader() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" aria-hidden="true" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ─── Tipos ─── */

interface ResumoProps {
  nomeLoja: string;
  slug: string;
  whatsapp: string;
  nomeResponsavel: string;
}

/* ─── Componente principal ─── */

export function OnboardingWizard() {
  const [passo, setPasso] = useState(1);

  // Passo 1
  const [nomeLoja, setNomeLoja] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [slugDisponivel, setSlugDisponivel] = useState<boolean | null>(null);
  const [verificandoSlug, setVerificandoSlug] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");

  // Passo 2
  const [nomeResponsavel, setNomeResponsavel] = useState("");

  // Passo 3
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Global
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Auto-gerar slug a partir do nome da loja ── */
  useEffect(() => {
    if (slugManual) return;
    const slugGerado = nomeLoja
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(slugGerado);
  }, [nomeLoja, slugManual]);

  /* ── Verificar disponibilidade do slug (debounce 500ms) ── */
  useEffect(() => {
    if (slug.length < 2) {
      setSlugDisponivel(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setVerificandoSlug(true);
      setSlugDisponivel(null);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";

        const res = await fetch(
          `${API_URL}/v1/onboarding/check-slug?slug=${encodeURIComponent(slug)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const json = await res.json();
          setSlugDisponivel(json.data?.available === true);
        } else {
          setSlugDisponivel(null);
        }
      } catch {
        setSlugDisponivel(null);
      } finally {
        setVerificandoSlug(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  /* ── Validação de combo de templates ── */
  function isComboValido(templates: string[]): boolean {
    if (templates.length > 2) return false;

    // Restaurante é standalone
    if (templates.includes("restaurante") && templates.length > 1) return false;

    // Validar combos
    const hasAdega = templates.includes("adega");
    const hasMercado = templates.includes("mercado");
    const hasRestaurante = templates.includes("restaurante");

    // Não permitir: Restaurante + Adega, Restaurante + Mercado
    if (hasRestaurante && (hasAdega || hasMercado)) return false;

    // Adega + Mercado é OK
    return true;
  }

  /* ── Handler de seleção de template ── */
  function handleTemplateToggle(templateId: string) {
    const novo = selecionados.includes(templateId)
      ? selecionados.filter((t) => t !== templateId)
      : [...selecionados, templateId];

    if (isComboValido(novo)) {
      setSelecionados(novo);
      setErro(null);
    } else {
      setErro("Combinação inválida. Restaurante é exclusivo e não pode ser combinado com outros tipos.");
    }
  }

  /* ── Submit final ── */
  async function handleCriarLoja() {
    setErro(null);
    setCarregando(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const res = await fetch(`${API_URL}/v1/onboarding/setup-store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName: nomeLoja,
          storeSlug: slug,
          whatsappPhone: whatsapp,
          ownerName: nomeResponsavel,
          templateIds: selecionados,
        }),
      });

      if (res.ok) {
        window.location.href = "/";
        return;
      }

      const json = await res.json().catch(() => null);
      const mensagem = json?.error?.message ?? json?.message ?? "Erro ao criar a loja. Tente novamente.";
      setErro(mensagem);
    } catch {
      setErro("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  /* ── Validações por passo ── */
  const passo1Valido =
    nomeLoja.trim().length >= 2 &&
    slug.length >= 2 &&
    slugDisponivel === true &&
    whatsapp.trim().length >= 8;

  const passo2Valido = nomeResponsavel.trim().length >= 2;

  const passo3Valido = selecionados.length > 0 && isComboValido(selecionados);

  /* ── Feedback do slug ── */
  function FeedbackSlug() {
    if (slug.length < 2) return null;
    if (verificandoSlug) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
          <IconoLoader /> Verificando...
        </span>
      );
    }
    if (slugDisponivel === true) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--green)" }}>
          <IconoCheck /> Disponivel
        </span>
      );
    }
    if (slugDisponivel === false) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#dc2626" }}>
          <IconoX /> Ja em uso
        </span>
      );
    }
    return null;
  }

  /* ── Indicador de passo ── */
  function IndicadorPasso() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: n <= passo ? "var(--green)" : "var(--s6)",
                color: n <= passo ? "#fff" : "var(--s4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                transition: "background 0.2s",
              }}
            >
              {n}
            </div>
            {n < 4 && (
              <div
                style={{
                  width: 32,
                  height: 2,
                  background: n < passo ? "var(--green)" : "var(--s6)",
                  transition: "background 0.2s",
                }}
              />
            )}
          </div>
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}>
          Passo {passo} de 4
        </span>
      </div>
    );
  }

  /* ── Passo 1: Dados da loja ── */
  if (passo === 1) {
    return (
      <div className="wp-auth-card">
        <IndicadorPasso />
        <h1 className="wp-auth-title">Configure sua loja</h1>
        <p className="wp-auth-subtitle">Defina as informacoes basicas do seu espaco na Vendza.</p>

        <div className="wp-stack">
          <div className="wp-field">
            <label htmlFor="nomeLoja" className="wp-label">Nome da loja</label>
            <input
              id="nomeLoja"
              type="text"
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              placeholder="Ex: Adega do Carlos"
              minLength={2}
              required
              className="wp-input"
            />
          </div>

          <div className="wp-field">
            <label htmlFor="slug" className="wp-label">
              Slug / URL da loja
              <span style={{ marginLeft: 8 }}>
                <FeedbackSlug />
              </span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              placeholder="minha-adega"
              minLength={2}
              required
              className="wp-input"
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
              Exemplo: minha-adega → vendza.com/minha-adega
            </span>
          </div>

          <div className="wp-field">
            <label htmlFor="whatsapp" className="wp-label">WhatsApp</label>
            <input
              id="whatsapp"
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="55 11 99999-9999"
              required
              className="wp-input"
            />
          </div>

          <button
            type="button"
            className="wp-button"
            disabled={!passo1Valido}
            onClick={() => setPasso(2)}
            style={{ width: "100%", marginTop: 4 }}
          >
            Proximo
          </button>
        </div>
      </div>
    );
  }

  /* ── Passo 2: Dados do responsável ── */
  if (passo === 2) {
    return (
      <div className="wp-auth-card">
        <IndicadorPasso />
        <h1 className="wp-auth-title">Dados do responsavel</h1>
        <p className="wp-auth-subtitle">Como devemos chamar voce na plataforma?</p>

        <div className="wp-stack">
          <div className="wp-field">
            <label htmlFor="nomeResponsavel" className="wp-label">Nome completo</label>
            <input
              id="nomeResponsavel"
              type="text"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder="Ex: Carlos Oliveira"
              minLength={2}
              required
              className="wp-input"
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              type="button"
              className="wp-button-secondary"
              onClick={() => setPasso(1)}
              style={{ flex: 1 }}
            >
              Voltar
            </button>
            <button
              type="button"
              className="wp-button"
              disabled={!passo2Valido}
              onClick={() => setPasso(3)}
              style={{ flex: 2 }}
            >
              Proximo
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Passo 3: Selecionar templates ── */
  if (passo === 3) {
    const templates = [
      {
        id: "restaurante",
        nome: "Restaurante",
        descricao: "Comida, bebidas, sobremesas",
        categorias: 8,
      },
      {
        id: "adega",
        nome: "Adega",
        descricao: "Bebidas alcoólicas e acessórios",
        categorias: 7,
      },
      {
        id: "mercado",
        nome: "Mercado",
        descricao: "Alimentos, higiene, limpeza",
        categorias: 10,
      },
    ];

    return (
      <div className="wp-auth-card">
        <IndicadorPasso />
        <h1 className="wp-auth-title">Escolha o tipo da sua loja</h1>
        <p className="wp-auth-subtitle">
          Você pode selecionar até 2 tipos. Restaurante é exclusivo.
        </p>

        <div className="wp-stack">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {templates.map((template) => (
              <label
                key={template.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 12,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  border: "1px solid var(--s5)",
                  transition: "background 0.2s, border-color 0.2s",
                  backgroundColor: selecionados.includes(template.id)
                    ? "rgba(45, 106, 79, 0.05)"
                    : "transparent",
                  borderColor: selecionados.includes(template.id)
                    ? "var(--green)"
                    : "var(--s5)",
                }}
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(template.id)}
                  onChange={() => handleTemplateToggle(template.id)}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: "var(--green)",
                    cursor: "pointer",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--night)",
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    {template.nome}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    {template.descricao}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {template.categorias} categorias
                  </div>
                </div>
              </label>
            ))}
          </div>

          {erro && <div className="wp-error-box">{erro}</div>}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              type="button"
              className="wp-button-secondary"
              onClick={() => {
                setPasso(2);
                setErro(null);
              }}
              style={{ flex: 1 }}
            >
              Voltar
            </button>
            <button
              type="button"
              className="wp-button"
              disabled={!passo3Valido}
              onClick={() => setPasso(4)}
              style={{ flex: 2 }}
            >
              Proximo
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Passo 4: Confirmação ── */
  return (
    <div className="wp-auth-card">
      <IndicadorPasso />
      <h1 className="wp-auth-title">Confirme os dados</h1>
      <p className="wp-auth-subtitle">Revise as informacoes antes de criar sua loja.</p>

      <div className="wp-stack">
        <div
          style={{
            background: "var(--s7)",
            borderRadius: "var(--radius-sm)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <ResumoLinha rotulo="Nome da loja" valor={nomeLoja} />
          <ResumoLinha rotulo="Slug / URL" valor={`vendza.com/${slug}`} />
          <ResumoLinha rotulo="WhatsApp" valor={whatsapp} />
          <ResumoLinha rotulo="Responsavel" valor={nomeResponsavel} />
          <ResumoLinha
            rotulo="Tipo de loja"
            valor={
              selecionados.length === 1 && selecionados[0]
                ? selecionados[0].charAt(0).toUpperCase() +
                  selecionados[0].slice(1)
                : selecionados
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" + ")
            }
          />
        </div>

        {erro && <div className="wp-error-box">{erro}</div>}

        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <button
            type="button"
            className="wp-button-secondary"
            onClick={() => { setPasso(3); setErro(null); }}
            disabled={carregando}
            style={{ flex: 1 }}
          >
            Voltar
          </button>
          <button
            type="button"
            className="wp-button"
            onClick={handleCriarLoja}
            disabled={carregando}
            style={{ flex: 2 }}
          >
            {carregando ? "Criando loja..." : "Criar minha loja"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-componente de linha de resumo ─── */

function ResumoLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{rotulo}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--night)", textAlign: "right", wordBreak: "break-all" }}>{valor}</span>
    </div>
  );
}
