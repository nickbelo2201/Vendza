"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createClient } from "../../../utils/supabase/client";

/* ══════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════ */
type TabModal = "login" | "cadastro";

/* ══════════════════════════════════════════════════════════════
   SVG LOGO
══════════════════════════════════════════════════════════════ */
function LogoSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D499" />
          <stop offset="100%" stopColor="#1A7A5E" />
        </linearGradient>
        <filter id="lf1">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M36 2 L68 20 L68 56 L36 74 L4 56 L4 20 Z"
        fill="#e8f5f0"
        stroke="rgba(26,122,94,0.4)"
        strokeWidth="1.5"
      />
      <path
        d="M4 36 L11 36"
        stroke="rgba(26,122,94,0.35)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <path
        d="M61 36 L68 36"
        stroke="rgba(26,122,94,0.35)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <path
        d="M16 22L29 54L36 38L43 54L56 22"
        stroke="url(#lg1)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#lf1)"
      />
      <path
        d="M16 22L29 54L36 38L43 54L56 22"
        stroke="#1A7A5E"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="38" r="4" fill="#E8902A" />
      <circle cx="36" cy="38" r="2" fill="#FFB347" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL DE LOGIN
══════════════════════════════════════════════════════════════ */
function LoginModal({
  aberto,
  fechar,
}: {
  aberto: boolean;
  fechar: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabModal>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = "hidden";
      setTimeout(() => emailRef.current?.focus(), 350);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fechar]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) {
        setErro(
          error.message === "Invalid login credentials"
            ? "Email ou senha inválidos."
            : error.message
        );
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lp-modal-backdrop${aberto ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) fechar();
        }}
      >
        <div className="lp-modal-card">
          <button
            className="lp-modal-close"
            onClick={fechar}
            aria-label="Fechar"
          >
            ✕
          </button>

          {/* Logo */}
          <div className="lp-modal-logo">
            <LogoSVG size={28} />
            <div className="lp-modal-wm">
              Vend<em>z</em>a
            </div>
          </div>

          {/* Header */}
          <div className="lp-modal-h">
            <h2 className="lp-modal-title">Acessar painel</h2>
            <p className="lp-modal-sub">
              Bem-vindo de volta.{" "}
              <strong>Seu negócio está esperando.</strong>
            </p>
          </div>

          {/* Tabs */}
          <div className="lp-modal-tabs">
            <button
              className={`lp-tab${tab === "login" ? " active" : ""}`}
              onClick={() => setTab("login")}
            >
              Entrar
            </button>
            <button
              className={`lp-tab${tab === "cadastro" ? " active" : ""}`}
              onClick={() => setTab("cadastro")}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="lp-inp-group">
              <label className="lp-inp-label" htmlFor="m-email">
                E-mail
              </label>
              <input
                ref={emailRef}
                className="lp-inp"
                type="email"
                id="m-email"
                placeholder="seu@email.com.br"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Senha */}
            <div className="lp-inp-group">
              <label className="lp-inp-label" htmlFor="m-pass">
                Senha
              </label>
              <div className="lp-inp-wrap">
                <input
                  className="lp-inp"
                  type={mostrarSenha ? "text" : "password"}
                  id="m-pass"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  className="lp-inp-eye"
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label="Mostrar senha"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lembrar + Esqueci */}
            <div className="lp-inp-row">
              <label className="lp-inp-check">
                <input type="checkbox" id="m-rem" />
                <span>Lembrar por 30 dias</span>
              </label>
              <a href="#" className="lp-inp-forgot">
                Esqueceu a senha?
              </a>
            </div>

            {/* Erro */}
            {erro && <div className="lp-modal-erro">{erro}</div>}

            {/* Submit */}
            <button
              className="lp-btn-submit"
              type="submit"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "lp-spin .7s linear infinite" }}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar no painel
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="lp-modal-div">
            <span>ou</span>
          </div>

          {/* Novo usuário */}
          <p className="lp-modal-new">
            Novo na Vendza?{" "}
            <a href="#">Fale com nosso time →</a>
          </p>

          {/* Social proof */}
          <div className="lp-modal-sp">
            <div className="lp-sp-avs">
              <div
                className="lp-sp-av"
                style={{
                  background: "linear-gradient(135deg,#1A7A5E,#22D499)",
                }}
              >
                R
              </div>
              <div
                className="lp-sp-av"
                style={{
                  background: "linear-gradient(135deg,#E8902A,#FFB347)",
                }}
              >
                D
              </div>
              <div
                className="lp-sp-av"
                style={{
                  background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
                }}
              >
                Z
              </div>
              <div
                className="lp-sp-av"
                style={{
                  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
                }}
              >
                C
              </div>
              <div
                className="lp-sp-av"
                style={{
                  background: "var(--lp-s6)",
                  fontSize: 9,
                  color: "var(--lp-s3)",
                }}
              >
                +308
              </div>
            </div>
            <div className="lp-sp-t">
              <strong>312 comerciantes</strong> já gerenciam com a Vendza
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — LANDING PAGE
══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);
  const [aiTexto, setAiTexto] = useState("");
  const aiMsgIdx = useRef(0);
  const aiCharIdx = useRef(0);
  const aiDeletando = useRef(false);
  const aiPausa = useRef(0);

  /* Navbar scroll shadow */
  useEffect(() => {
    function onScroll() {
      setNavScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* AI Typewriter */
  useEffect(() => {
    const msgs = [
      "Analisando padrões de compra...",
      "Reativando 14 clientes inativos...",
      "Gerando relatório de estoque...",
      "Agendando campanha de WhatsApp...",
      "Prevendo demanda para o fim de semana...",
      "Identificando produtos com baixa saída...",
    ];

    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      if (aiPausa.current > 0) {
        aiPausa.current--;
        timer = setTimeout(tick, 50);
        return;
      }
      const msg = msgs[aiMsgIdx.current] ?? "";
      if (!aiDeletando.current) {
        aiCharIdx.current++;
        setAiTexto(msg.slice(0, aiCharIdx.current));
        if (aiCharIdx.current === msg.length) {
          aiPausa.current = 60;
          aiDeletando.current = true;
        }
        timer = setTimeout(tick, 55);
      } else {
        aiCharIdx.current--;
        setAiTexto(msg.slice(0, aiCharIdx.current));
        if (aiCharIdx.current === 0) {
          aiDeletando.current = false;
          aiMsgIdx.current = (aiMsgIdx.current + 1) % msgs.length;
          aiPausa.current = 10;
        }
        timer = setTimeout(tick, 30);
      }
    }

    timer = setTimeout(tick, 1200);
    return () => clearTimeout(timer);
  }, []);

  /* Smooth scroll helper */
  function scrollParaSecao(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function abrirModal() {
    setModalAberto(true);
  }

  const faqItens = [
    {
      q: "R$350/mês é tudo ou tem cobrança extra?",
      a: "Tudo incluso no plano único: canal de venda, board, CRM, WhatsApp integrado e dashboard. Automação com IA sob medida é cobrada à parte, com escopo definido antes de começar. Sem cobrança por pedido ou por cliente.",
    },
    {
      q: "Meus clientes precisam baixar algum aplicativo?",
      a: "Não. Sua loja funciona no navegador, como um site — sem instalação de nada. O cliente acessa pelo link, pede e paga. Você compartilha o link no WhatsApp, no Instagram ou onde quiser.",
    },
    {
      q: "Posso continuar usando o WhatsApp do jeito que uso hoje?",
      a: "Sim. Os pedidos recebidos no seu WhatsApp entram automaticamente no board. Você atende no chat normalmente — o que muda é que o pedido aparece registrado, organizado e rastreável no painel, sem depender de memória ou papel.",
    },
    {
      q: "Quanto tempo leva para começar a vender?",
      a: "Em uma tarde, você já está operando. Cadastra a loja, sobe o catálogo e configura a área de entrega. Nossa equipe te acompanha no onboarding sem custo extra — não é uma gravação, é uma pessoa.",
    },
    {
      q: "Tem fidelidade ou multa para cancelar?",
      a: "Sem fidelidade e sem multa. Você cancela quando quiser, pelo painel, e a cobrança para no mês seguinte. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.",
    },
    {
      q: "Qual a diferença real para o Zé Delivery e Neemo?",
      a: "Zé Delivery cobra comissão e os clientes ficam com eles — você é só mais um fornecedor. Neemo tem painel pesado e CRM pouco acionável. Vendza é canal próprio, com CRM desde o primeiro dia, sem comissão e sem complexidade desnecessária.",
    },
  ];

  return (
    <>
      {/* ── ESTILOS DA LANDING PAGE ── */}
      <style>{`
        /* ══ GOOGLE FONTS ══ */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        /* ══ TOKENS ══ */
        .lp-root {
          --lp-g:     #1A7A5E;
          --lp-gn:    #15a87c;
          --lp-gl:    #e8f5f0;
          --lp-gll:   #f0faf6;
          --lp-amb:   #E8902A;
          --lp-ambl:  #fff4e6;
          --lp-night: #0f172a;
          --lp-s1:    #1e293b;
          --lp-s2:    #334155;
          --lp-s3:    #64748b;
          --lp-s4:    #94a3b8;
          --lp-s5:    #cbd5e1;
          --lp-s6:    #e2e8f0;
          --lp-s7:    #f1f5f9;
          --lp-s8:    #f8fafc;
          --lp-white: #ffffff;
          --lp-glow:  0 0 0 3px rgba(26,122,94,.15), 0 8px 32px rgba(26,122,94,.2);
          --lp-shadow-sm: 0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04);
          --lp-shadow-md: 0 4px 16px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.04);
          --lp-shadow-lg: 0 12px 40px rgba(15,23,42,.12), 0 4px 12px rgba(15,23,42,.06);
          --lp-shadow-xl: 0 24px 64px rgba(15,23,42,.16), 0 8px 20px rgba(15,23,42,.08);
          --lp-r: 8px;
          --lp-rl: 16px;
          --lp-rxl: 24px;
          --lp-rf: 9999px;
        }

        /* ══ RESET DENTRO DO ROOT ══ */
        .lp-root *,
        .lp-root *::before,
        .lp-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .lp-root {
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          position: relative;
        }

        /* ══ BACKGROUNDS ══ */
        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(26,122,94,.13) 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: .55;
        }
        .lp-root::after {
          content: '';
          position: fixed;
          top: -250px;
          right: -150px;
          z-index: 0;
          pointer-events: none;
          width: 900px;
          height: 900px;
          border-radius: 50%;
          background: radial-gradient(ellipse at 45% 45%, rgba(26,122,94,.13) 0%, rgba(34,212,153,.06) 35%, transparent 70%);
          filter: blur(72px);
        }
        .lp-bg-amb {
          position: fixed;
          bottom: -200px;
          left: -150px;
          z-index: 0;
          pointer-events: none;
          width: 720px;
          height: 720px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(232,144,42,.09) 0%, transparent 60%);
          filter: blur(80px);
        }
        .lp-bg-mid {
          position: fixed;
          top: 45%;
          left: -80px;
          z-index: 0;
          pointer-events: none;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(26,122,94,.05) 0%, transparent 70%);
          filter: blur(60px);
        }

        /* ══ NAVBAR ══ */
        .lp-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          background: rgba(255,255,255,.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--lp-s6);
          transition: box-shadow .3s;
        }
        .lp-navbar.scrolled { box-shadow: var(--lp-shadow-sm); }
        .lp-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .lp-nav-wordmark {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -.03em;
          color: var(--lp-night);
        }
        .lp-nav-wordmark em { font-style: normal; color: var(--lp-amb); }
        .lp-nav-links { display: flex; gap: 2px; }
        .lp-nav-a {
          padding: 6px 16px;
          border-radius: var(--lp-r);
          font-size: 13px;
          font-weight: 500;
          color: var(--lp-s3);
          text-decoration: none;
          cursor: pointer;
          transition: all .18s;
          background: none;
          border: none;
        }
        .lp-nav-a:hover { color: var(--lp-night); background: var(--lp-s7); }
        .lp-nav-actions { display: flex; align-items: center; gap: 10px; }
        .lp-nav-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--lp-gn);
          background: var(--lp-gl);
          border: 1px solid rgba(26,122,94,.2);
          padding: 4px 12px;
          border-radius: var(--lp-rf);
        }
        .lp-nb-dot {
          width: 5px;
          height: 5px;
          background: var(--lp-gn);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--lp-gn);
          animation: lp-pls 1.8s infinite;
        }
        @keyframes lp-pls { 0%,100%{opacity:1} 50%{opacity:.3} }
        .lp-btn-demo {
          padding: 8px 18px;
          border-radius: var(--lp-r);
          font-size: 13px;
          font-weight: 600;
          color: var(--lp-s2);
          border: 1px solid var(--lp-s5);
          background: #fff;
          cursor: pointer;
          transition: all .18s;
        }
        .lp-btn-demo:hover { border-color: var(--lp-g); color: var(--lp-g); background: var(--lp-gl); }
        .lp-btn-login {
          padding: 9px 22px;
          border-radius: var(--lp-r);
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: var(--lp-g);
          border: none;
          cursor: pointer;
          transition: all .2s;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: .01em;
        }
        .lp-btn-login:hover { background: var(--lp-gn); box-shadow: var(--lp-shadow-md); transform: translateY(-1px); }

        /* ══ HERO ══ */
        .lp-hero {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 0 80px;
          padding-top: 64px;
          gap: 40px;
          overflow: hidden;
        }
        .lp-hero-left {
          display: flex;
          flex-direction: column;
          padding: 60px 0;
        }
        .lp-h-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--lp-gl);
          border: 1px solid rgba(26,122,94,.25);
          border-radius: var(--lp-rf);
          padding: 6px 16px;
          margin-bottom: 48px;
          width: fit-content;
          animation: lp-rise .6s ease both;
        }
        .lp-h-badge-dot {
          width: 5px;
          height: 5px;
          background: var(--lp-gn);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--lp-gn);
          animation: lp-pls 1.5s infinite;
        }
        .lp-h-badge-txt { font-size: 11px; font-weight: 700; color: var(--lp-gn); text-transform: uppercase; letter-spacing: .1em; }
        .lp-h-badge-sep { color: var(--lp-s5); }
        .lp-h-badge-sub { font-size: 11px; color: var(--lp-s3); }
        .lp-headline { margin-bottom: 32px; }
        .lp-hl-front {
          display: block;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: clamp(48px, 5vw, 76px);
          line-height: 1.1;
          letter-spacing: -.04em;
          color: var(--lp-s4);
          animation: lp-rise .65s ease .24s both;
          margin-top: 2px;
        }
        .lp-hl-green {
          color: var(--lp-g);
          position: relative;
        }
        .lp-hl-green::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--lp-g), var(--lp-gn));
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          animation: lp-underline 1s ease .9s forwards;
        }
        @keyframes lp-underline { to { transform: scaleX(1) } }
        .lp-hl-amb { color: var(--lp-amb); }
        .lp-h-sub {
          font-size: 17px;
          line-height: 1.75;
          color: var(--lp-s3);
          max-width: 460px;
          margin-bottom: 40px;
          animation: lp-rise .7s ease .35s both;
        }
        .lp-h-sub strong { color: var(--lp-s1); font-weight: 600; }
        .lp-h-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 48px;
          animation: lp-rise .7s ease .42s both;
        }
        .lp-btn-h-p {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 13px 26px;
          border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          background: var(--lp-g);
          border: none;
          cursor: pointer;
          transition: box-shadow .3s, transform .25s cubic-bezier(.34,1.4,.64,1);
          letter-spacing: .01em;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .lp-btn-h-p:hover { background: var(--lp-gn); box-shadow: 0 8px 32px rgba(26,122,94,.35), 0 2px 8px rgba(26,122,94,.2); transform: translateY(-2px); }
        .lp-btn-h-s {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 13px 22px;
          border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: var(--lp-s2);
          background: #fff;
          border: 1.5px solid var(--lp-s5);
          cursor: pointer;
          transition: all .22s;
        }
        .lp-btn-h-s:hover { border-color: var(--lp-g); color: var(--lp-g); background: var(--lp-gl); }
        .lp-h-stats {
          display: flex;
          gap: 0;
          border: 1px solid var(--lp-s6);
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: var(--lp-shadow-sm);
          width: fit-content;
          animation: lp-rise .8s ease .5s both;
        }
        .lp-hst { padding: 14px 24px; border-right: 1px solid var(--lp-s6); }
        .lp-hst:last-child { border-right: none; }
        .lp-hst-val {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 20px;
          color: var(--lp-night);
          display: block;
          margin-bottom: 1px;
        }
        .lp-hst-val.green { color: var(--lp-g); }
        .lp-hst-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: var(--lp-s4); }

        /* ══ HERO RIGHT ══ */
        .lp-hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 0 60px 20px;
          min-height: 600px;
        }
        .lp-dash-card {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border: 1px solid rgba(26,122,94,.15);
          border-radius: var(--lp-rxl);
          box-shadow: 0 32px 80px rgba(15,23,42,.18), 0 8px 24px rgba(15,23,42,.10), 0 0 0 1px rgba(26,122,94,.08), 0 24px 60px rgba(26,122,94,.12);
          overflow: hidden;
          transform: perspective(1400px) rotateY(-6deg) rotateX(3deg);
          transition: transform .4s ease, box-shadow .4s ease;
          animation: lp-rise .7s ease .3s both, lp-tiltFloat 6s ease-in-out 1.2s infinite alternate;
          position: relative;
          z-index: 3;
        }
        .lp-dash-card:hover {
          transform: perspective(1400px) rotateY(-2deg) rotateX(1deg);
          box-shadow: 0 40px 100px rgba(15,23,42,.2), 0 12px 32px rgba(15,23,42,.12), 0 0 0 1px rgba(26,122,94,.12), 0 32px 80px rgba(26,122,94,.16);
        }
        @keyframes lp-tiltFloat {
          0%{transform:perspective(1400px) rotateY(-6deg) rotateX(3deg) translateY(0)}
          100%{transform:perspective(1400px) rotateY(-4deg) rotateX(2deg) translateY(-10px)}
        }
        .lp-dc-bar {
          height: 40px;
          background: var(--lp-s8);
          border-bottom: 1px solid var(--lp-s6);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 6px;
        }
        .lp-dc-dot { width: 9px; height: 9px; border-radius: 50%; }
        .lp-dc-url {
          flex: 1;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--lp-s4);
        }
        .lp-dc-body { padding: 18px; }
        .lp-dc-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
        .lp-dc-s { background: var(--lp-s8); border-radius: 10px; padding: 12px 14px; border: 1px solid var(--lp-s6); }
        .lp-dc-sv { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 16px; color: var(--lp-night); margin-bottom: 3px; }
        .lp-dc-sv.green { color: var(--lp-g); }
        .lp-dc-sv.amber { color: var(--lp-amb); }
        .lp-dc-sl { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: var(--lp-s4); }
        .lp-dc-delta { font-size: 9px; color: var(--lp-g); font-weight: 600; margin-top: 2px; }
        .lp-dc-chart {
          background: var(--lp-s8);
          border-radius: 12px;
          padding: 14px 16px 10px;
          border: 1px solid var(--lp-s6);
          margin-bottom: 14px;
        }
        .lp-dc-chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .lp-dc-chart-title { font-size: 11px; font-weight: 600; color: var(--lp-s2); }
        .lp-dc-chart-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: var(--lp-g); }
        .lp-chart-area { height: 72px; display: flex; align-items: flex-end; gap: 5px; position: relative; }
        .lp-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .lp-bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transform-origin: bottom;
          animation: lp-barUp .8s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes lp-barUp { from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }
        .lp-bar-lbl { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: var(--lp-s4); }
        .lp-dc-board { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        .lp-dc-col-head {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          padding: 4px 8px;
          border-radius: 5px;
          margin-bottom: 5px;
          text-align: center;
        }
        .lp-dc-item {
          border-radius: 6px;
          padding: 7px 9px;
          margin-bottom: 5px;
          border-left: 2px solid;
          background: var(--lp-s8);
        }
        .lp-dc-iname { font-size: 9px; color: var(--lp-s2); margin-bottom: 1px; }
        .lp-dc-ival { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--lp-night); }

        /* ── VENZO MASCOTE ── */
        .lp-venzo-float {
          position: absolute;
          top: -20px;
          right: -30px;
          z-index: 5;
          animation: lp-vFloat 3.5s ease-in-out infinite;
          filter: drop-shadow(0 8px 24px rgba(26,122,94,.45)) drop-shadow(0 0 40px rgba(34,212,153,.3)) drop-shadow(0 24px 48px rgba(26,122,94,.2));
        }
        .lp-venzo-glow {
          position: absolute;
          top: -40px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(26,122,94,.18) 0%, rgba(34,212,153,.08) 40%, transparent 70%);
          filter: blur(24px);
          z-index: 4;
          animation: lp-vFloat 3.5s ease-in-out infinite;
          animation-delay: .15s;
        }
        @keyframes lp-vFloat { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-18px) rotate(2deg)} }
        .lp-venzo-bubble {
          position: absolute;
          top: 10px;
          right: 115px;
          background: var(--lp-night);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 7px 13px;
          border-radius: 12px 12px 2px 12px;
          white-space: nowrap;
          z-index: 6;
          box-shadow: var(--lp-shadow-md);
          animation: lp-vFloat 3.5s ease-in-out infinite;
          animation-delay: .3s;
        }
        .lp-venzo-bubble::after {
          content: '';
          position: absolute;
          right: -6px;
          bottom: 0;
          width: 0;
          height: 0;
          border-left: 8px solid var(--lp-night);
          border-top: 6px solid transparent;
        }

        /* ── NOTIFICAÇÕES FLUTUANTES ── */
        .lp-notif {
          position: absolute;
          background: #fff;
          border: 1px solid var(--lp-s6);
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: var(--lp-shadow-md);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 4;
          white-space: nowrap;
          opacity: 0;
        }
        .lp-notif-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .lp-notif-title { font-size: 12px; font-weight: 600; color: var(--lp-night); }
        .lp-notif-sub { font-size: 10px; color: var(--lp-s4); margin-top: 1px; }
        .lp-notif-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; margin-left: auto; padding-left: 12px; }
        .lp-notif-1 { top: 60px; left: -60px; animation: lp-notifIn .6s ease .8s forwards, lp-notifFloat1 4s ease-in-out 1.5s infinite; }
        .lp-notif-2 { bottom: 140px; left: -40px; animation: lp-notifIn .6s ease 1.2s forwards, lp-notifFloat2 4.5s ease-in-out 2s infinite; }
        .lp-notif-3 { bottom: 60px; right: -30px; animation: lp-notifIn .6s ease 1.6s forwards, lp-notifFloat3 5s ease-in-out 2.5s infinite; }
        @keyframes lp-notifIn { from{opacity:0;transform:translateX(-16px) scale(.95)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes lp-notifFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes lp-notifFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes lp-notifFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .lp-card-glow {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(26,122,94,.08) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%,-50%);
          z-index: 1;
          pointer-events: none;
          animation: lp-glowPulse 4s ease-in-out infinite;
        }
        @keyframes lp-glowPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.6} 50%{transform:translate(-50%,-50%) scale(1.15);opacity:1} }

        /* ══ FEATURES ══ */
        .lp-features {
          position: relative;
          z-index: 1;
          padding: 100px 80px;
          background: #fff;
          border-top: 1px solid var(--lp-s6);
          scroll-margin-top: 72px;
        }
        .lp-feat-header { text-align: center; margin-bottom: 72px; }
        .lp-feat-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: var(--lp-g);
          margin-bottom: 16px;
        }
        .lp-feat-tag::before,.lp-feat-tag::after { content:''; width:20px; height:1.5px; background:var(--lp-g); border-radius:1px; }
        .lp-feat-h {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: clamp(32px, 4vw, 48px);
          letter-spacing: -.03em;
          color: var(--lp-night);
          margin-bottom: 16px;
          line-height: 1.15;
        }
        .lp-feat-h .g { color: var(--lp-g); }
        .lp-feat-desc { font-size: 16px; color: var(--lp-s3); max-width: 520px; margin: 0 auto; line-height: 1.7; }

        /* ══ BENTO ══ */
        .lp-feat-bento {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          grid-template-rows: 260px 210px auto;
          gap: 14px;
          max-width: 1100px;
          margin: 0 auto 80px;
        }
        .lp-fb-ai {
          grid-column: 1/3;
          grid-row: 1/3;
          background: var(--lp-night);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,.06);
          padding: 36px 40px;
          position: relative;
          overflow: hidden;
          cursor: default;
        }
        .lp-fb-ai::before {
          content:'';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(26,122,94,.06) 1px,transparent 1px), linear-gradient(90deg,rgba(26,122,94,.06) 1px,transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 70% at 80% 60%,transparent 30%,black 100%);
        }
        .lp-fb-ai::after {
          content:'';
          position: absolute;
          top: -100px;
          right: -80px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(ellipse,rgba(26,122,94,.18) 0%,rgba(34,212,153,.08) 45%,transparent 70%);
          filter: blur(50px);
          pointer-events: none;
        }
        .lp-fb-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(232,144,42,.15);
          border: 1px solid rgba(232,144,42,.3);
          border-radius: var(--lp-rf);
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 700;
          color: var(--lp-amb);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }
        .lp-fb-ai-icon { font-size: 36px; margin-bottom: 16px; position: relative; z-index: 1; display: inline-block; }
        .lp-fb-ai-t {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: clamp(22px, 2.2vw, 30px);
          letter-spacing: -.025em;
          color: #fff;
          margin-bottom: 12px;
          line-height: 1.2;
          position: relative;
          z-index: 1;
        }
        .lp-fb-ai-d {
          font-size: 14px;
          color: rgba(255,255,255,.5);
          line-height: 1.75;
          max-width: 380px;
          position: relative;
          z-index: 1;
          margin-bottom: 28px;
        }
        .lp-fb-ai-activity {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          padding: 10px 16px;
          position: relative;
          z-index: 1;
          margin-bottom: 20px;
          width: fit-content;
        }
        .lp-fb-ai-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--lp-gn);
          box-shadow: 0 0 8px var(--lp-gn);
          animation: lp-pls 1.4s infinite;
          flex-shrink: 0;
        }
        .lp-fb-ai-tw { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(255,255,255,.7); min-width: 220px; }
        .lp-fb-ai-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: var(--lp-gn);
          margin-left: 2px;
          animation: lp-blink .8s step-end infinite;
          vertical-align: text-bottom;
        }
        @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .lp-fb-ai-tags { display: flex; gap: 8px; flex-wrap: wrap; position: relative; z-index: 1; }
        .lp-fb-ai-tag {
          padding: 4px 12px;
          border-radius: var(--lp-rf);
          background: rgba(26,122,94,.15);
          border: 1px solid rgba(26,122,94,.25);
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,.65);
          letter-spacing: .02em;
        }

        /* bento regular cards */
        .lp-fb-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid var(--lp-s6);
          padding: 28px;
          position: relative;
          overflow: hidden;
          cursor: default;
          transition: border-color .3s, box-shadow .3s, transform .25s;
        }
        .lp-fb-card:hover {
          border-color: rgba(26,122,94,.25);
          box-shadow: 0 12px 40px rgba(15,23,42,.08), 0 2px 8px rgba(26,122,94,.06);
          transform: translateY(-2px);
        }
        .lp-fb-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .lp-fb-t { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; color: var(--lp-night); margin-bottom: 7px; }
        .lp-fb-d { font-size: 12.5px; color: var(--lp-s3); line-height: 1.7; }
        .lp-fb-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 14px;
          font-size: 10px;
          font-weight: 700;
          color: var(--lp-g);
          background: var(--lp-gl);
          border: 1px solid rgba(26,122,94,.15);
          padding: 3px 10px;
          border-radius: var(--lp-rf);
        }
        .lp-fb-mini-board { display: flex; gap: 8px; margin-top: 14px; width: 100%; overflow: hidden; }
        .lp-fb-mini-col { flex: 1; min-width: 0; }
        .lp-fb-mini-head {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          padding: 3px 6px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lp-fb-mini-item {
          border-radius: 6px;
          padding: 5px 8px;
          margin-bottom: 4px;
          border-left: 2px solid;
          background: var(--lp-s8);
          font-size: 9px;
          color: var(--lp-s2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── CTA BLOCK ── */
        .lp-cta-block {
          max-width: 900px;
          margin: 0 auto;
          background: linear-gradient(135deg, var(--lp-night) 0%, #0d2e24 100%);
          border-radius: 24px;
          padding: 64px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .lp-cta-block::before {
          content:'';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(ellipse,rgba(26,122,94,.2) 0%,transparent 65%);
        }
        .lp-cta-gtag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .15em; color: var(--lp-gn); margin-bottom: 16px; position: relative; z-index: 1; }
        .lp-cta-gt {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: clamp(28px, 3.5vw, 40px);
          letter-spacing: -.03em;
          color: #fff;
          margin-bottom: 14px;
          line-height: 1.2;
          position: relative;
          z-index: 1;
        }
        .lp-cta-gd { font-size: 15px; color: rgba(255,255,255,.45); margin-bottom: 36px; position: relative; z-index: 1; }
        .lp-cta-btns { display: flex; gap: 12px; justify-content: center; position: relative; z-index: 1; flex-wrap: wrap; }
        .lp-btn-cp {
          padding: 13px 28px;
          border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          background: var(--lp-g);
          border: none;
          cursor: pointer;
          transition: box-shadow .3s, transform .25s cubic-bezier(.34,1.4,.64,1);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-btn-cp:hover { background: var(--lp-gn); box-shadow: 0 8px 32px rgba(26,122,94,.35); transform: translateY(-1px); }
        .lp-btn-cs {
          padding: 13px 24px;
          border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: rgba(255,255,255,.65);
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          cursor: pointer;
          transition: all .22s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-btn-cs:hover { color: #fff; background: rgba(255,255,255,.12); }

        /* ══ COMO FUNCIONA ══ */
        .lp-how {
          position: relative;
          z-index: 1;
          padding: 100px 80px;
          background: var(--lp-s8);
          border-top: 1px solid var(--lp-s6);
          border-bottom: 1px solid var(--lp-s6);
          scroll-margin-top: 72px;
        }
        .lp-how-inner { max-width: 1100px; margin: 0 auto; }
        .lp-how-header { text-align: center; margin-bottom: 72px; }
        .lp-how-steps {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 0;
          position: relative;
        }
        .lp-how-steps::before {
          content: '';
          position: absolute;
          top: 28px;
          left: calc(16.66% + 12px);
          right: calc(16.66% + 12px);
          height: 1px;
          background: linear-gradient(90deg,transparent,var(--lp-s5) 20%,var(--lp-s5) 80%,transparent);
          z-index: 0;
          pointer-events: none;
        }
        .lp-how-step { padding: 0 40px; text-align: center; position: relative; z-index: 1; }
        .lp-how-step:first-child { padding-left: 0; }
        .lp-how-step:last-child { padding-right: 0; }
        .lp-how-num {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid var(--lp-s5);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 16px;
          color: var(--lp-g);
          box-shadow: var(--lp-shadow-sm);
        }
        .lp-how-step-t { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 16px; color: var(--lp-night); margin-bottom: 10px; }
        .lp-how-step-d { font-size: 13.5px; color: var(--lp-s3); line-height: 1.75; max-width: 260px; margin: 0 auto; }
        .lp-how-step-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--lp-gl);
          color: var(--lp-g);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        /* ══ SEGMENTOS ══ */
        .lp-segments {
          position: relative;
          z-index: 1;
          padding: 100px 80px;
          background: #fff;
          border-top: 1px solid var(--lp-s6);
          scroll-margin-top: 72px;
        }
        .lp-seg-inner { max-width: 1100px; margin: 0 auto; }
        .lp-seg-header { margin-bottom: 56px; }
        .lp-seg-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        .lp-seg-card {
          background: var(--lp-s8);
          border: 1px solid var(--lp-s6);
          border-radius: 20px;
          padding: 32px;
          transition: all .3s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .lp-seg-card::before {
          content:'';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--lp-g);
          border-radius: 3px 0 0 3px;
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform .3s cubic-bezier(.34,1.2,.64,1);
        }
        .lp-seg-card:hover { background: #fff; box-shadow: var(--lp-shadow-md); transform: translateY(-2px); }
        .lp-seg-card:hover::before { transform: scaleY(1); }
        .lp-seg-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: var(--lp-rf);
          background: var(--lp-gl);
          border: 1px solid rgba(26,122,94,.15);
          font-size: 11px;
          font-weight: 700;
          color: var(--lp-g);
          margin-bottom: 16px;
          letter-spacing: .04em;
        }
        .lp-seg-t { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 18px; color: var(--lp-night); margin-bottom: 12px; }
        .lp-seg-dor { font-size: 13px; color: var(--lp-s3); line-height: 1.7; padding-left: 14px; border-left: 2px solid var(--lp-s5); margin-bottom: 12px; }
        .lp-seg-resolve { font-size: 13px; color: var(--lp-s2); line-height: 1.7; }
        .lp-seg-resolve strong { color: var(--lp-g); }

        /* ══ PRICING ══ */
        .lp-pricing {
          position: relative;
          z-index: 1;
          padding: 100px 80px;
          background: var(--lp-s8);
          border-top: 1px solid var(--lp-s6);
          scroll-margin-top: 72px;
        }
        .lp-price-inner { max-width: 1100px; margin: 0 auto; }
        .lp-price-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 16px; margin-top: 56px; }
        .lp-price-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid var(--lp-s6);
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        .lp-price-card.main { border-color: rgba(26,122,94,.25); box-shadow: 0 8px 32px rgba(26,122,94,.08); }
        .lp-price-card.main::before {
          content:'';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--lp-g), var(--lp-gn));
        }
        .lp-price-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--lp-gl);
          border: 1px solid rgba(26,122,94,.2);
          border-radius: var(--lp-rf);
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 700;
          color: var(--lp-g);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 24px;
        }
        .lp-price-name { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 22px; color: var(--lp-night); margin-bottom: 8px; }
        .lp-price-val { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 48px; letter-spacing: -.03em; color: var(--lp-night); line-height: 1; margin-bottom: 4px; }
        .lp-price-val sup { font-size: 20px; vertical-align: top; margin-top: 8px; margin-right: 2px; }
        .lp-price-val span { font-size: 16px; font-weight: 500; color: var(--lp-s4); }
        .lp-price-per { font-size: 12px; color: var(--lp-s4); margin-bottom: 28px; }
        .lp-price-per strong { color: var(--lp-g); }
        .lp-price-divider { height: 1px; background: var(--lp-s6); margin-bottom: 24px; }
        .lp-price-items { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; }
        .lp-price-items li { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: var(--lp-s2); }
        .lp-price-items li::before {
          content:'';
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--lp-gl);
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='8' viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4l2.5 2.5L9 1' stroke='%231A7A5E' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          margin-top: 1px;
        }
        .lp-price-cta { width: 100%; }
        .lp-price-ai-note { font-size: 12px; color: var(--lp-s4); line-height: 1.7; padding: 16px; background: rgba(232,144,42,.04); border: 1px solid rgba(232,144,42,.12); border-radius: 12px; margin-top: 16px; }
        .lp-price-ai-note strong { color: var(--lp-amb); }
        .lp-price-compare { margin-top: 40px; background: #fff; border-radius: 16px; border: 1px solid var(--lp-s6); overflow: hidden; }
        .lp-pc-head { display: grid; grid-template-columns: 1fr 1fr 1fr; background: var(--lp-s8); border-bottom: 1px solid var(--lp-s6); }
        .lp-pc-head div { padding: 12px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--lp-s4); }
        .lp-pc-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid var(--lp-s6); }
        .lp-pc-row:last-child { border-bottom: none; }
        .lp-pc-cell { padding: 14px 20px; font-size: 13px; color: var(--lp-s2); display: flex; align-items: center; gap: 8px; }
        .lp-pc-cell.label { font-weight: 600; color: var(--lp-s1); }
        .lp-pc-cell.bad { color: #ef4444; }
        .lp-pc-cell.good { color: var(--lp-g); font-weight: 600; }

        /* ══ FAQ ══ */
        .lp-faq {
          position: relative;
          z-index: 1;
          padding: 100px 80px;
          background: #fff;
          border-top: 1px solid var(--lp-s6);
          scroll-margin-top: 72px;
        }
        .lp-faq-inner { max-width: 860px; margin: 0 auto; }
        .lp-faq-list { margin-top: 56px; display: flex; flex-direction: column; gap: 0; }
        .lp-faq-item { border-bottom: 1px solid var(--lp-s6); overflow: hidden; }
        .lp-faq-item:first-child { border-top: 1px solid var(--lp-s6); }
        .lp-faq-q {
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 0;
          text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--lp-night);
          transition: color .2s;
        }
        .lp-faq-q:hover { color: var(--lp-g); }
        .lp-faq-q.open { color: var(--lp-g); }
        .lp-faq-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--lp-s7);
          border: 1px solid var(--lp-s6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all .3s;
          color: var(--lp-s3);
        }
        .lp-faq-icon.open { background: var(--lp-gl); border-color: rgba(26,122,94,.2); color: var(--lp-g); transform: rotate(45deg); }
        .lp-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height .4s cubic-bezier(.34,1.2,.64,1);
        }
        .lp-faq-a.open { max-height: 200px; }
        .lp-faq-a p { padding-bottom: 22px; font-size: 14px; color: var(--lp-s3); line-height: 1.8; }

        /* ══ MODAL ══ */
        .lp-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15,23,42,.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity .3s ease, visibility .3s ease;
          padding: 24px;
        }
        .lp-modal-backdrop.open { opacity: 1; visibility: visible; }
        .lp-modal-backdrop.open .lp-modal-card { transform: scale(1) translateY(0); opacity: 1; }
        .lp-modal-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 32px 80px rgba(15,23,42,.3), 0 8px 24px rgba(15,23,42,.12);
          border: 1px solid var(--lp-s6);
          padding: 40px;
          transform: scale(.95) translateY(12px);
          opacity: 0;
          transition: transform .35s cubic-bezier(.34,1.3,.64,1), opacity .3s ease;
          position: relative;
        }
        .lp-modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--lp-s7);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lp-s3);
          font-size: 16px;
          line-height: 1;
          transition: all .18s;
        }
        .lp-modal-close:hover { background: var(--lp-s6); color: var(--lp-night); }
        .lp-modal-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
        .lp-modal-wm { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: -.03em; color: var(--lp-night); }
        .lp-modal-wm em { font-style: normal; color: var(--lp-amb); }
        .lp-modal-h { margin-bottom: 20px; }
        .lp-modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px; letter-spacing: -.025em; color: var(--lp-night); margin-bottom: 6px; }
        .lp-modal-sub { font-size: 13px; color: var(--lp-s3); line-height: 1.6; }
        .lp-modal-sub strong { color: var(--lp-s1); font-weight: 500; }
        .lp-modal-tabs { display: flex; gap: 4px; background: var(--lp-s7); border-radius: 10px; padding: 4px; margin-bottom: 24px; }
        .lp-tab {
          flex: 1;
          padding: 8px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all .2s;
          background: none;
          color: var(--lp-s3);
        }
        .lp-tab.active { background: #fff; color: var(--lp-night); box-shadow: 0 1px 4px rgba(15,23,42,.08); }
        .lp-inp-group { margin-bottom: 14px; }
        .lp-inp-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--lp-s4); margin-bottom: 6px; }
        .lp-inp {
          width: 100%;
          padding: 11px 14px;
          border-radius: var(--lp-r);
          border: 1.5px solid var(--lp-s5);
          background: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--lp-night);
          outline: none;
          transition: all .2s;
        }
        .lp-inp::placeholder { color: var(--lp-s5); }
        .lp-inp:focus { border-color: var(--lp-g); box-shadow: 0 0 0 3px rgba(26,122,94,.1); }
        .lp-inp-wrap { position: relative; }
        .lp-inp-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--lp-s4);
          font-size: 15px;
          line-height: 1;
          transition: color .2s;
          padding: 4px;
        }
        .lp-inp-eye:hover { color: var(--lp-night); }
        .lp-inp-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .lp-inp-check { display: flex; align-items: center; gap: 7px; cursor: pointer; }
        .lp-inp-check input { width: 15px; height: 15px; border-radius: 4px; accent-color: var(--lp-g); cursor: pointer; }
        .lp-inp-check span { font-size: 12px; color: var(--lp-s3); }
        .lp-inp-forgot { font-size: 12px; color: var(--lp-g); text-decoration: none; font-weight: 600; }
        .lp-inp-forgot:hover { text-decoration: underline; }
        .lp-modal-erro { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 14px; }
        .lp-btn-submit {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          background: var(--lp-g);
          transition: all .22s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: .01em;
          position: relative;
          overflow: hidden;
        }
        .lp-btn-submit:hover { background: var(--lp-gn); box-shadow: 0 6px 20px rgba(26,122,94,.3); transform: translateY(-1px); }
        .lp-btn-submit:disabled { opacity: .7; cursor: not-allowed; transform: none; }
        .lp-modal-div { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .lp-modal-div::before,.lp-modal-div::after { content:''; flex:1; height:1px; background:var(--lp-s6); }
        .lp-modal-div span { font-size: 11px; color: var(--lp-s4); }
        .lp-modal-new { text-align: center; font-size: 13px; color: var(--lp-s4); }
        .lp-modal-new a { color: var(--lp-g); font-weight: 600; text-decoration: none; }
        .lp-modal-new a:hover { text-decoration: underline; }
        .lp-modal-sp { display: flex; align-items: center; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--lp-s6); }
        .lp-sp-avs { display: flex; }
        .lp-sp-av {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #fff;
          margin-left: -6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .lp-sp-av:first-child { margin-left: 0; }
        .lp-sp-t { font-size: 11px; color: var(--lp-s3); line-height: 1.5; }
        .lp-sp-t strong { color: var(--lp-s1); }

        /* ══ FOOTER ══ */
        .lp-footer {
          position: relative;
          z-index: 1;
          background: var(--lp-night);
          padding: 48px 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,.06);
        }
        .lp-footer-logo { display: flex; align-items: center; gap: 10px; }
        .lp-footer-wm { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: -.03em; color: #fff; }
        .lp-footer-wm em { font-style: normal; color: var(--lp-amb); }
        .lp-footer-copy { font-size: 12px; color: rgba(255,255,255,.3); }

        /* ══ ANIMATIONS ══ */
        @keyframes lp-rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        /* ══ RESPONSIVE ══ */
        @media(max-width:900px){
          .lp-hero { grid-template-columns: 1fr; padding: 0 32px; }
          .lp-hero-right { display: none; }
          .lp-features,.lp-how,.lp-segments,.lp-pricing,.lp-faq { padding: 60px 32px; }
          .lp-feat-bento { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .lp-fb-ai { grid-column: 1/3; grid-row: auto; }
          .lp-cta-block { padding: 40px 32px; }
          .lp-how-steps { grid-template-columns: 1fr; }
          .lp-how-steps::before { display: none; }
          .lp-how-step { padding: 0 0 48px; text-align: left; display: flex; flex-direction: column; align-items: flex-start; }
          .lp-how-num { margin: 0 0 16px; }
          .lp-seg-grid { grid-template-columns: 1fr; }
          .lp-price-grid { grid-template-columns: 1fr; }
          .lp-footer { flex-direction: column; gap: 16px; text-align: center; padding: 40px 32px; }
        }
        @media(max-width:600px){
          .lp-navbar { padding: 0 20px; }
          .lp-nav-links { display: none; }
          .lp-nav-badge { display: none; }
          .lp-features,.lp-how,.lp-segments,.lp-pricing,.lp-faq { padding: 48px 20px; }
          .lp-feat-bento { grid-template-columns: 1fr; grid-template-rows: auto; }
          .lp-fb-ai { grid-column: auto; grid-row: auto; }
          .lp-pc-head,.lp-pc-row { grid-template-columns: 1fr 1fr; }
          .lp-footer { padding: 32px 20px; }
        }
      `}</style>

      {/* ── WRAPPER ── */}
      <div className="lp-root">
        {/* Blobs de fundo */}
        <div className="lp-bg-amb" />
        <div className="lp-bg-mid" />

        {/* ────────── NAVBAR ────────── */}
        <nav className={`lp-navbar${navScrolled ? " scrolled" : ""}`}>
          <a href="#" className="lp-nav-logo">
            <LogoSVG size={28} />
            <div className="lp-nav-wordmark">
              Vend<em>z</em>a
            </div>
          </a>

          <div className="lp-nav-links">
            <button className="lp-nav-a" onClick={() => scrollParaSecao("lp-features")}>Produto</button>
            <button className="lp-nav-a" onClick={() => scrollParaSecao("lp-segmentos")}>Segmentos</button>
            <button className="lp-nav-a" onClick={() => scrollParaSecao("lp-precos")}>Preços</button>
            <button className="lp-nav-a" onClick={() => scrollParaSecao("lp-faq")}>Dúvidas</button>
          </div>

          <div className="lp-nav-actions">
            <div className="lp-nav-badge">
              <div className="lp-nb-dot" />
              IA disponível
            </div>
            <button className="lp-btn-demo" onClick={() => scrollParaSecao("lp-features")}>
              Ver demo
            </button>
            <button className="lp-btn-login" onClick={abrirModal}>
              Entrar
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </nav>

        {/* ────────── HERO ────────── */}
        <section className="lp-hero">
          {/* Left */}
          <div className="lp-hero-left">
            <div className="lp-h-badge">
              <div className="lp-h-badge-dot" />
              <span className="lp-h-badge-txt">Novo</span>
              <span className="lp-h-badge-sep">·</span>
              <span className="lp-h-badge-sub">Gestão + IA para comércio local brasileiro</span>
            </div>

            <div className="lp-headline">
              <div className="lp-hl-front">
                <span className="lp-hl-green">Gestão operacional</span>
                <br />
                <span>com </span>
                <span className="lp-hl-amb">IA</span>
                <span> para</span>
                <br />
                <span>comércio local</span>
              </div>
            </div>

            <p className="lp-h-sub">
              Canal de venda próprio, board de pedidos, CRM e automação com IA.
              <br />
              <strong>Um dia de configuração.</strong> Controle real a partir daí.
            </p>

            <div className="lp-h-ctas">
              <button className="lp-btn-h-p" onClick={abrirModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Começar agora — grátis
              </button>
              <button className="lp-btn-h-s" onClick={() => scrollParaSecao("lp-como-funciona")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Ver como funciona
              </button>
            </div>

            <div className="lp-h-stats">
              <div className="lp-hst">
                <span className="lp-hst-val green">R$4.2M</span>
                <span className="lp-hst-lbl">processados</span>
              </div>
              <div className="lp-hst">
                <span className="lp-hst-val">312+</span>
                <span className="lp-hst-lbl">comerciantes</span>
              </div>
              <div className="lp-hst">
                <span className="lp-hst-val">18k</span>
                <span className="lp-hst-lbl">pedidos/mês</span>
              </div>
            </div>
          </div>

          {/* Right — dashboard animado */}
          <div className="lp-hero-right">
            <div className="lp-card-glow" />
            <div className="lp-venzo-glow" />

            {/* Venzo mascote */}
            <div className="lp-venzo-float" style={{ width: 90, height: 100 }}>
              <svg width="90" height="100" viewBox="0 0 200 220" fill="none">
                <defs>
                  <filter id="vf1">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <radialGradient id="vbg1" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#22A376" />
                    <stop offset="100%" stopColor="#0d4a36" />
                  </radialGradient>
                </defs>
                <ellipse cx="100" cy="115" rx="68" ry="76" fill="#1A7A5E" filter="url(#vf1)" opacity=".3" />
                <ellipse cx="100" cy="115" rx="60" ry="68" fill="url(#vbg1)" />
                <ellipse cx="80" cy="92" rx="24" ry="17" fill="rgba(255,255,255,0.1)" transform="rotate(-18 80 92)" />
                <circle cx="76" cy="104" r="14" fill="white" />
                <circle cx="124" cy="104" r="14" fill="white" />
                <circle cx="78" cy="106" r="7" fill="#0f172a" />
                <circle cx="126" cy="106" r="7" fill="#0f172a" />
                <circle cx="80" cy="104" r="2.5" fill="white" />
                <circle cx="128" cy="104" r="2.5" fill="white" />
                <path d="M82 122 Q100 136 118 122" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <circle cx="100" cy="50" r="9" fill="#E8902A" filter="url(#vf1)" opacity=".8" />
                <circle cx="100" cy="50" r="6" fill="#E8902A" />
                <circle cx="100" cy="50" r="3" fill="#FFB347" />
                <path d="M33 108 Q16 96 18 80" stroke="#1A7A5E" strokeWidth="11" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="77" r="9" fill="#1A7A5E" />
                <path d="M167 108 Q184 96 182 80" stroke="#1A7A5E" strokeWidth="11" strokeLinecap="round" fill="none" />
                <circle cx="184" cy="77" r="9" fill="#1A7A5E" />
                <path d="M179 71 L183 76 L191 68" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="lp-venzo-bubble">Tudo no controle ↑</div>

            {/* Notificações flutuantes */}
            <div className="lp-notif lp-notif-1">
              <div className="lp-notif-icon" style={{ background: "#e8f5f0", color: "var(--lp-g)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <div>
                <div className="lp-notif-title">Novo pedido!</div>
                <div className="lp-notif-sub">Pedro Alves · agora</div>
              </div>
              <div className="lp-notif-val" style={{ color: "var(--lp-g)" }}>R$187</div>
            </div>

            <div className="lp-notif lp-notif-2">
              <div className="lp-notif-icon" style={{ background: "#e8f5f0", color: "var(--lp-g)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div>
                <div className="lp-notif-title">Faturamento subindo</div>
                <div className="lp-notif-sub">+23% este mês</div>
              </div>
              <div className="lp-notif-val" style={{ color: "var(--lp-g)" }}>↑</div>
            </div>

            <div className="lp-notif lp-notif-3">
              <div className="lp-notif-icon" style={{ background: "#f0fdf4", color: "var(--lp-g)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="lp-notif-title">Entregue com sucesso</div>
                <div className="lp-notif-sub">Maria Costa · 2min</div>
              </div>
            </div>

            {/* Dashboard Card */}
            <div className="lp-dash-card">
              <div className="lp-dc-bar">
                <div className="lp-dc-dot" style={{ background: "#ff5f57" }} />
                <div className="lp-dc-dot" style={{ background: "#febc2e" }} />
                <div className="lp-dc-dot" style={{ background: "#28c840" }} />
                <div className="lp-dc-url">vendza.com.br/painel</div>
              </div>

              <div className="lp-dc-body">
                <div className="lp-dc-stats">
                  <div className="lp-dc-s">
                    <div className="lp-dc-sv green">R$3.840</div>
                    <div className="lp-dc-sl">Hoje</div>
                    <div className="lp-dc-delta">↑ +18%</div>
                  </div>
                  <div className="lp-dc-s">
                    <div className="lp-dc-sv amber">7</div>
                    <div className="lp-dc-sl">Em aberto</div>
                  </div>
                  <div className="lp-dc-s">
                    <div className="lp-dc-sv">234</div>
                    <div className="lp-dc-sl">Clientes</div>
                  </div>
                </div>

                <div className="lp-dc-chart">
                  <div className="lp-dc-chart-header">
                    <span className="lp-dc-chart-title">Faturamento — últimos 7 dias</span>
                    <span className="lp-dc-chart-val">R$26.4k</span>
                  </div>
                  <div className="lp-chart-area">
                    {[
                      { h: "38%", bg: "var(--lp-s5)", lbl: "Seg", delay: ".05s" },
                      { h: "52%", bg: "var(--lp-s5)", lbl: "Ter", delay: ".12s" },
                      { h: "44%", bg: "var(--lp-s5)", lbl: "Qua", delay: ".19s" },
                      { h: "68%", bg: "rgba(26,122,94,.35)", lbl: "Qui", delay: ".26s" },
                      { h: "82%", bg: "rgba(26,122,94,.5)", lbl: "Sex", delay: ".33s" },
                      { h: "91%", bg: "var(--lp-g)", lbl: "Sáb", delay: ".4s" },
                      { h: "100%", bg: "linear-gradient(180deg,var(--lp-gn),var(--lp-g))", lbl: "Dom", delay: ".47s", destaque: true },
                    ].map((b) => (
                      <div key={b.lbl} className="lp-bar-wrap">
                        <div
                          className="lp-bar"
                          style={{ height: b.h, background: b.bg, animationDelay: b.delay, ...(b.destaque ? { boxShadow: "0 0 12px rgba(26,122,94,.3)" } : {}) }}
                        />
                        <div className="lp-bar-lbl" style={b.destaque ? { color: "var(--lp-g)", fontWeight: 700 } : {}}>{b.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lp-dc-board">
                  <div>
                    <div className="lp-dc-col-head" style={{ background: "rgba(59,130,246,.08)", color: "#3b82f6" }}>Novos</div>
                    <div className="lp-dc-item" style={{ borderColor: "#3b82f6" }}>
                      <div className="lp-dc-iname">Pedro A.</div>
                      <div className="lp-dc-ival">R$187</div>
                    </div>
                    <div className="lp-dc-item" style={{ borderColor: "#3b82f6" }}>
                      <div className="lp-dc-iname">Sara M.</div>
                      <div className="lp-dc-ival">R$94</div>
                    </div>
                  </div>
                  <div>
                    <div className="lp-dc-col-head" style={{ background: "rgba(232,144,42,.08)", color: "var(--lp-amb)" }}>Preparo</div>
                    <div className="lp-dc-item" style={{ borderColor: "var(--lp-amb)" }}>
                      <div className="lp-dc-iname">Carlos R.</div>
                      <div className="lp-dc-ival">R$312</div>
                    </div>
                  </div>
                  <div>
                    <div className="lp-dc-col-head" style={{ background: "rgba(34,197,94,.08)", color: "#16a34a" }}>Entregue</div>
                    <div className="lp-dc-item" style={{ borderColor: "#16a34a" }}>
                      <div className="lp-dc-iname">Ana L. ✓</div>
                      <div className="lp-dc-ival">R$156</div>
                    </div>
                    <div className="lp-dc-item" style={{ borderColor: "#16a34a" }}>
                      <div className="lp-dc-iname">Rita S. ✓</div>
                      <div className="lp-dc-ival">R$231</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ────────── FEATURES ────────── */}
        <section className="lp-features" id="lp-features">
          <div className="lp-feat-header">
            <div className="lp-feat-tag">Por que a Vendza</div>
            <h2 className="lp-feat-h">
              Chega de improvisar.
              <br />
              <span className="g">Hora de ter controle.</span>
            </h2>
            <p className="lp-feat-desc">
              Cada parte do seu negócio conectada. Do pedido ao cliente fiel, sem depender de marketplace nem de planilha.
            </p>
          </div>

          <div className="lp-feat-bento">
            {/* IA Hero Card */}
            <div className="lp-fb-ai">
              <div className="lp-fb-ai-badge">✦ Exclusivo Vendza</div>
              <div className="lp-fb-ai-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--lp-gn)" }}>
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                  <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
                  <path d="M10 10h4v4h-4z" fill="rgba(34,212,153,.3)" stroke="var(--lp-gn)" />
                </svg>
              </div>
              <h3 className="lp-fb-ai-t">
                IA que atende
                <br />o seu negócio
              </h3>
              <p className="lp-fb-ai-d">
                Não é automação genérica. Você descreve o que precisa — recuperar cliente inativo, avisar sobre promoção, prever falta de estoque — e a IA faz. Configurada pra sua operação, não pra operação de outra pessoa.
              </p>
              <div className="lp-fb-ai-activity">
                <div className="lp-fb-ai-dot" />
                <span className="lp-fb-ai-tw">
                  {aiTexto}
                  <span className="lp-fb-ai-cursor" />
                </span>
              </div>
              <div className="lp-fb-ai-tags">
                {["WhatsApp", "Estoque", "Reativação", "Relatórios", "RH"].map((t) => (
                  <span key={t} className="lp-fb-ai-tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Canal de venda */}
            <div className="lp-fb-card">
              <div className="lp-fb-icon" style={{ background: "var(--lp-gl)", color: "var(--lp-g)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <div className="lp-fb-t">Venda sem pagar comissão</div>
              <div className="lp-fb-d">Sua loja no seu domínio, com catálogo, checkout e entrega configurados por você. O cliente é seu — não do marketplace.</div>
              <div className="lp-fb-badge">✓ Zero comissão</div>
            </div>

            {/* Board de pedidos */}
            <div className="lp-fb-card" style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ display: "flex", alignItems: "center", color: "#3b82f6", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="3" x2="21" y2="3" />
                    <rect x="3" y="6" width="5" height="12" rx="1.5" />
                    <rect x="9.5" y="6" width="5" height="7" rx="1.5" />
                    <rect x="16" y="6" width="5" height="10" rx="1.5" />
                  </svg>
                </span>
                <div className="lp-fb-t" style={{ marginBottom: 0, fontSize: 13 }}>Board em tempo real</div>
              </div>
              <div className="lp-fb-mini-board" style={{ flex: 1 }}>
                <div className="lp-fb-mini-col">
                  <div className="lp-fb-mini-head" style={{ background: "rgba(59,130,246,.08)", color: "#3b82f6" }}>Novo</div>
                  <div className="lp-fb-mini-item" style={{ borderColor: "#3b82f6" }}>R$187</div>
                  <div className="lp-fb-mini-item" style={{ borderColor: "#3b82f6" }}>R$94</div>
                </div>
                <div className="lp-fb-mini-col">
                  <div className="lp-fb-mini-head" style={{ background: "rgba(232,144,42,.08)", color: "var(--lp-amb)" }}>Prep.</div>
                  <div className="lp-fb-mini-item" style={{ borderColor: "var(--lp-amb)" }}>R$312</div>
                  <div className="lp-fb-mini-item" style={{ borderColor: "var(--lp-amb)" }}>R$78</div>
                </div>
                <div className="lp-fb-mini-col">
                  <div className="lp-fb-mini-head" style={{ background: "rgba(26,122,94,.08)", color: "var(--lp-g)" }}>Entregue</div>
                  <div className="lp-fb-mini-item" style={{ borderColor: "var(--lp-g)" }}>✓ R$156</div>
                  <div className="lp-fb-mini-item" style={{ borderColor: "var(--lp-g)" }}>✓ R$231</div>
                </div>
              </div>
            </div>

            {/* CRM */}
            <div className="lp-fb-card">
              <div className="lp-fb-icon" style={{ background: "rgba(139,92,246,.08)", color: "#8b5cf6" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="7" rx="9" ry="3" />
                  <path d="M3 7v10c0 1.66 3.99 3 9 3s9-1.34 9-3V7" />
                  <path d="M3 12c0 1.66 3.99 3 9 3s9-1.34 9-3" />
                </svg>
              </div>
              <div className="lp-fb-t">Sabe quem é fiel</div>
              <div className="lp-fb-d">Histórico completo de cada cliente: o que comprou, quando sumiu, quanto gastou. Pare de tratar regular como desconhecido.</div>
              <div className="lp-fb-badge">✓ Automático</div>
            </div>

            {/* WhatsApp */}
            <div className="lp-fb-card">
              <div className="lp-fb-icon" style={{ background: "rgba(37,211,102,.08)", color: "#15a877" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  <line x1="8" y1="9" x2="16" y2="9" />
                  <line x1="8" y1="13" x2="13" y2="13" />
                </svg>
              </div>
              <div className="lp-fb-t">WhatsApp vira painel</div>
              <div className="lp-fb-d">Pedido que chega no WhatsApp entra direto no board. Sem copiar manualmente, sem post-it, sem esquecimento no meio da correria.</div>
              <div className="lp-fb-badge">✓ Integração nativa</div>
            </div>

            {/* Dashboard */}
            <div className="lp-fb-card">
              <div className="lp-fb-icon" style={{ background: "var(--lp-gl)", color: "var(--lp-g)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="20" x2="22" y2="20" strokeWidth="1.5" />
                  <rect x="3" y="11" width="4" height="9" rx="1" />
                  <rect x="10" y="6" width="4" height="14" rx="1" />
                  <rect x="17" y="3" width="4" height="17" rx="1" />
                </svg>
              </div>
              <div className="lp-fb-t">Números que fazem sentido</div>
              <div className="lp-fb-d">Faturamento real, ticket médio, produtos mais vendidos e clientes inativos. Tudo numa tela, sem precisar puxar planilha.</div>
              <div className="lp-fb-badge">✓ Dados reais</div>
            </div>
          </div>

          {/* CTA Block */}
          <div className="lp-cta-block">
            <div className="lp-cta-gtag">Pronto para parar de trabalhar pra marketplace?</div>
            <h3 className="lp-cta-gt">
              Controle total.
              <br />
              Zero comissão. Começa hoje.
            </h3>
            <p className="lp-cta-gd">Canal próprio, board de pedidos e CRM em um dia. Sem contrato e sem surpresa na fatura.</p>
            <div className="lp-cta-btns">
              <button className="lp-btn-cp" onClick={abrirModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Criar minha conta
              </button>
              <button className="lp-btn-cs" onClick={abrirModal}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  <line x1="8" y1="9" x2="16" y2="9" />
                </svg>
                Falar com a equipe
              </button>
            </div>
          </div>
        </section>

        {/* ────────── COMO FUNCIONA ────────── */}
        <section className="lp-how" id="lp-como-funciona">
          <div className="lp-how-inner">
            <div className="lp-how-header">
              <div className="lp-feat-tag">Como funciona</div>
              <h2 className="lp-feat-h">
                Três passos.
                <br />
                <span className="g">Do caos ao controle.</span>
              </h2>
              <p className="lp-feat-desc">
                Sem migração complicada. Sem treinar equipe por semanas. Sem pagar nada extra pra começar.
              </p>
            </div>

            <div className="lp-how-steps">
              {[
                {
                  num: "01",
                  titulo: "Seu canal em minutos",
                  desc: "Configure sua loja, catálogo e zona de entrega. Sem depender de marketplace, sem comissão de terceiro.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  ),
                },
                {
                  num: "02",
                  titulo: "Todos os pedidos num lugar",
                  desc: "WhatsApp, loja online e balcão aparecem no mesmo board. Nenhum pedido se perde, nenhum cliente fica sem resposta.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="3" x2="21" y2="3" />
                      <rect x="3" y="6" width="5" height="12" rx="1.5" />
                      <rect x="9.5" y="6" width="5" height="7" rx="1.5" />
                      <rect x="16" y="6" width="5" height="10" rx="1.5" />
                    </svg>
                  ),
                },
                {
                  num: "03",
                  titulo: "A IA trabalha por você",
                  desc: "Recuperação de clientes sumidos, avisos de estoque, relatórios automáticos. Automação sob medida pro seu negócio.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <div key={s.num} className="lp-how-step">
                  <div className="lp-how-step-icon">{s.icon}</div>
                  <div className="lp-how-num">{s.num}</div>
                  <div className="lp-how-step-t">{s.titulo}</div>
                  <p className="lp-how-step-d">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ────────── SEGMENTOS ────────── */}
        <section className="lp-segments" id="lp-segmentos">
          <div className="lp-seg-inner">
            <div className="lp-seg-header">
              <div className="lp-feat-tag">Para quem é</div>
              <h2 className="lp-feat-h">
                Feito para quem
                <br />
                <span className="g">vende de verdade.</span>
              </h2>
              <p className="lp-feat-desc" style={{ maxWidth: 600 }}>
                Adegas, restaurantes, distribuidoras e qualquer comércio que entrega. Se você vende, a Vendza organiza.
              </p>
            </div>

            <div className="lp-seg-grid">
              {[
                {
                  pill: "Adega / Bebidas",
                  titulo: "Pare de pagar 30% pro Zé Delivery.",
                  dor: "Marketplace come sua margem e os clientes ficam com eles — você só vê a entrega.",
                  resolve: "Canal direto com vitrine de vinhos, cervejas e destilados. <strong>O cliente compra no seu link, a margem fica com você.</strong>",
                },
                {
                  pill: "Restaurante / Delivery",
                  titulo: "Pedido no WhatsApp, anotação no papel, esquecimento no rush.",
                  dor: "No pico da noite, pedidos caem no chat e você não sabe o que entrou, o que saiu ou o que esqueceu.",
                  resolve: "Board em tempo real com todos os canais integrados. <strong>Cozinha vê, entregador vê, dono vê — ao mesmo tempo.</strong>",
                },
                {
                  pill: "Distribuidora / B2B",
                  titulo: "Carteira grande, histórico de ninguém.",
                  dor: "Cliente B2B precisa de atendimento personalizado, mas você não tem histórico de pedido de nenhum deles.",
                  resolve: "CRM com histórico por cliente, pedidos recorrentes e automação de follow-up. <strong>Você age antes de perder o contrato.</strong>",
                },
                {
                  pill: "Comércio local",
                  titulo: "Faturamento existe. Mas de onde vem?",
                  dor: "Você vende, mas não sabe de onde vem o resultado nem como repetir o que deu certo no mês anterior.",
                  resolve: "Dashboard com métricas reais e IA que identifica padrão de compra. <strong>Você age antes de perder o cliente.</strong>",
                },
              ].map((s) => (
                <div key={s.pill} className="lp-seg-card">
                  <div className="lp-seg-pill">{s.pill}</div>
                  <div className="lp-seg-t">{s.titulo}</div>
                  <div className="lp-seg-dor">{s.dor}</div>
                  <div
                    className="lp-seg-resolve"
                    dangerouslySetInnerHTML={{ __html: s.resolve }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ────────── PRICING ────────── */}
        <section className="lp-pricing" id="lp-precos">
          <div className="lp-price-inner">
            <div className="lp-seg-header">
              <div className="lp-feat-tag">Preços</div>
              <h2 className="lp-feat-h">
                Um preço.
                <br />
                <span className="g">Tudo incluso.</span>
              </h2>
              <p className="lp-feat-desc" style={{ maxWidth: 520 }}>
                Sem taxa por pedido. Sem cobrança por cliente. Sem surpresa no mês.
              </p>
            </div>

            <div className="lp-price-grid">
              {/* Plano principal */}
              <div className="lp-price-card main">
                <div className="lp-price-tag">✓ Plano único</div>
                <div className="lp-price-name">Vendza Plataforma</div>
                <div className="lp-price-val">
                  <sup>R$</sup>350<span>/mês</span>
                </div>
                <div className="lp-price-per">
                  Sem fidelidade. Cancele quando quiser. <strong>14 dias grátis.</strong>
                </div>
                <div className="lp-price-divider" />
                <ul className="lp-price-items">
                  {[
                    "Vitrine própria com domínio customizável",
                    "Board de pedidos em tempo real",
                    "CRM com histórico completo de clientes",
                    "WhatsApp integrado ao painel",
                    "Dashboard de métricas e relatórios",
                    "Catálogo ilimitado de produtos",
                    "App para o cliente (PWA, sem instalação)",
                    "Suporte humanizado — não é bot",
                  ].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button className="lp-btn-h-p lp-price-cta" onClick={abrirModal} style={{ justifyContent: "center", width: "100%" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Começar 14 dias grátis
                </button>
              </div>

              {/* IA sob medida */}
              <div className="lp-price-card">
                <div className="lp-price-tag" style={{ background: "var(--lp-ambl)", borderColor: "rgba(232,144,42,.3)", color: "var(--lp-amb)" }}>✦ Exclusivo</div>
                <div className="lp-price-name">IA sob medida</div>
                <div className="lp-price-val" style={{ fontSize: 32, color: "var(--lp-amb)" }}>Sob consulta</div>
                <div className="lp-price-per">Escopo definido antes de começar. Sem surpresa.</div>
                <div className="lp-price-divider" />
                <ul className="lp-price-items">
                  {[
                    "Agente de WhatsApp treinado no seu negócio",
                    "Campanhas automáticas de reativação",
                    "Análise inteligente de estoque",
                    "Previsão de demanda semanal",
                    "Engenheiro de IA dedicado",
                    "Relatórios automáticos por e-mail ou WhatsApp",
                  ].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button className="lp-btn-h-s lp-price-cta" onClick={abrirModal} style={{ justifyContent: "center", width: "100%", padding: "13px 26px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    <line x1="8" y1="9" x2="16" y2="9" />
                  </svg>
                  Falar com a equipe
                </button>
                <div className="lp-price-ai-note">
                  <strong>Não é um chatbot genérico.</strong> Cada automação é configurada para a operação do seu negócio — com escopo e entrega definidos antes de cobrar.
                </div>
              </div>
            </div>

            {/* Comparação */}
            <div className="lp-price-compare">
              <div className="lp-pc-head">
                <div />
                <div>Vendza</div>
                <div>Zé Delivery / iFood</div>
              </div>
              {[
                { label: "Taxa por pedido", vendza: "Zero comissão", concorrente: "20–30% por pedido" },
                { label: "Dados dos clientes", vendza: "São seus, sempre", concorrente: "Ficam com a plataforma" },
                { label: "CRM nativo", vendza: "Incluso", concorrente: "Não existe" },
                { label: "Sua marca, seu domínio", vendza: "100%", concorrente: "Você é só mais um" },
              ].map((row) => (
                <div key={row.label} className="lp-pc-row">
                  <div className="lp-pc-cell label">{row.label}</div>
                  <div className="lp-pc-cell good">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {row.vendza}
                  </div>
                  <div className="lp-pc-cell bad">{row.concorrente}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ────────── FAQ ────────── */}
        <section className="lp-faq" id="lp-faq">
          <div className="lp-faq-inner">
            <div className="lp-seg-header" style={{ textAlign: "center" }}>
              <div className="lp-feat-tag">Dúvidas frequentes</div>
              <h2 className="lp-feat-h">
                Perguntas que
                <br />
                <span className="g">todo dono faz.</span>
              </h2>
            </div>

            <div className="lp-faq-list">
              {faqItens.map((item, idx) => {
                const aberto = faqAberto === idx;
                return (
                  <div key={idx} className="lp-faq-item">
                    <button
                      className={`lp-faq-q${aberto ? " open" : ""}`}
                      onClick={() => setFaqAberto(aberto ? null : idx)}
                    >
                      {item.q}
                      <span className={`lp-faq-icon${aberto ? " open" : ""}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    </button>
                    <div className={`lp-faq-a${aberto ? " open" : ""}`}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ────────── FOOTER ────────── */}
        <footer className="lp-footer">
          <div className="lp-footer-logo">
            <LogoSVG size={24} />
            <div className="lp-footer-wm">
              Vend<em>z</em>a
            </div>
          </div>
          <div className="lp-footer-copy">
            © {new Date().getFullYear()} Vendza. Todos os direitos reservados.
          </div>
        </footer>

        {/* ────────── MODAL ────────── */}
        <LoginModal aberto={modalAberto} fechar={() => setModalAberto(false)} />
      </div>
    </>
  );
}
