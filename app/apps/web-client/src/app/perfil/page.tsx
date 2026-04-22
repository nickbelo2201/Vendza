"use client";

import { useState, useEffect } from "react";
import { useEnderecos, usePerfil, type Endereco } from "../../hooks/useEnderecos";

const LABELS_ENDERECO = ["Casa", "Trabalho", "Outro"] as const;

function IconeLixo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconeMais() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CardEndereco({ endereco, onRemover }: { endereco: Endereco; onRemover: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "14px 16px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        background: "var(--surface)",
      }}
    >
      <div>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 99,
            background: "var(--accent-soft)",
            color: "var(--blue)",
            marginBottom: 6,
          }}
        >
          {endereco.label}
        </span>
        <p style={{ margin: 0, fontSize: 14, color: "var(--carbon)", lineHeight: 1.5 }}>
          {endereco.logradouro}, {endereco.numero}
          {endereco.complemento ? `, ${endereco.complemento}` : ""}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
          {endereco.bairro} — CEP {endereco.cep}
        </p>
      </div>
      <button
        onClick={onRemover}
        title="Remover endereço"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 4,
          flexShrink: 0,
        }}
      >
        <IconeLixo />
      </button>
    </div>
  );
}

function FormNovoEndereco({ onSalvar, salvar }: { onSalvar: () => void; salvar: (e: Omit<Endereco, "id" | "criadoEm">) => void }) {
  const [label, setLabel] = useState<string>("Casa");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    salvar({ label, logradouro, numero, complemento: complemento || undefined, bairro, cidade, estado, cep });
    onSalvar();
  }

  return (
    <form onSubmit={handleSubmit} className="wc-stack" style={{ marginTop: 16 }}>
      <div>
        <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
          Identificação *
        </label>
        <select
          className="wc-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        >
          {LABELS_ENDERECO.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="wc-checkout-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
            Logradouro *
          </label>
          <input
            className="wc-input"
            required
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
            placeholder="Nome da rua/av."
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
            Número *
          </label>
          <input
            className="wc-input"
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
          Complemento
        </label>
        <input
          className="wc-input"
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
          placeholder="Apto, bloco..."
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
          Bairro *
        </label>
        <input
          className="wc-input"
          required
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Seu bairro"
        />
      </div>

      <div className="wc-checkout-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 60px 130px", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
            Cidade *
          </label>
          <input
            className="wc-input"
            required
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
            UF *
          </label>
          <input
            className="wc-input"
            required
            maxLength={2}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            placeholder="SP"
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
            CEP *
          </label>
          <input
            className="wc-input"
            required
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="wc-btn wc-btn-primary">
          Salvar endereço
        </button>
        <button
          type="button"
          className="wc-btn"
          onClick={onSalvar}
          style={{ border: "1px solid var(--border)", background: "none", color: "var(--carbon)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function PerfilPage() {
  const { enderecos, salvar, remover, max } = useEnderecos();
  const { perfil, salvarPerfil, carregando } = usePerfil();
  const [adicionandoEndereco, setAdicionandoEndereco] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Sincroniza o formulário quando os dados do localStorage são carregados
  useEffect(() => {
    if (!carregando) {
      setNome(perfil.nome);
      setTelefone(perfil.telefone);
      setEmail(perfil.email);
    }
  }, [carregando, perfil.nome, perfil.telefone, perfil.email]);

  function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    salvarPerfil({ nome, telefone, email });
    setPerfilSalvo(true);
    setTimeout(() => setPerfilSalvo(false), 2500);
  }

  // Aguarda hidratação do localStorage antes de renderizar
  if (carregando) {
    return null;
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }} className="wc-stack">
      <h1 style={{ margin: 0, color: "var(--carbon)", fontSize: 22, fontWeight: 700 }}>
        Minha conta
      </h1>

      {/* Seção: Meu perfil */}
      <section className="wc-card wc-stack">
        <h2 style={{ margin: 0, color: "var(--carbon)", fontSize: 16, fontWeight: 600 }}>
          Meu perfil
        </h2>

        <form onSubmit={handleSalvarPerfil} className="wc-stack">
          <div>
            <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
              Nome completo
            </label>
            <input
              className="wc-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
              Telefone (com DDD)
            </label>
            <input
              className="wc-input"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="5511999999999"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4, color: "var(--text-muted)", fontSize: 13 }}>
              E-mail
            </label>
            <input
              className="wc-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="submit" className="wc-btn wc-btn-primary">
              Salvar perfil
            </button>
            {perfilSalvo && (
              <span style={{ color: "var(--green)", fontSize: 13, fontWeight: 500 }}>
                Salvo com sucesso!
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Seção: Meus endereços */}
      <section className="wc-card wc-stack">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: "var(--carbon)", fontSize: 16, fontWeight: 600 }}>
            Meus endereços
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {enderecos.length}/{max}
          </span>
        </div>

        {enderecos.length === 0 && !adicionandoEndereco && (
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Nenhum endereço salvo ainda.
          </p>
        )}

        {enderecos.map((end) => (
          <CardEndereco
            key={end.id}
            endereco={end}
            onRemover={() => remover(end.id)}
          />
        ))}

        {adicionandoEndereco ? (
          <FormNovoEndereco onSalvar={() => setAdicionandoEndereco(false)} salvar={salvar} />
        ) : (
          enderecos.length < max && (
            <button
              onClick={() => setAdicionandoEndereco(true)}
              className="wc-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px dashed var(--border)",
                background: "none",
                color: "var(--text-muted)",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <IconeMais />
              Adicionar endereço
            </button>
          )
        )}
      </section>
    </div>
  );
}
