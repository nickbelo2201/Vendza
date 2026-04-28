"use client";

import type { CSSProperties } from "react";

/**
 * StatusBadge — pílula de status reutilizável para tabelas do dashboard.
 *
 * Usado nas tabelas de Combos (Ativo/Inativo), Complementos (Disponível/Indisponível)
 * e Extras (Disponível/Indisponível). As cores são tokenizadas em globals.css
 * para garantir contraste WCAG AA tanto em modo light quanto dark.
 *
 * Visual:
 *  - on  → fundo verde claro saturado + texto verde escuro + ponto verde
 *  - off → fundo cinza claro + texto cinza escuro + ponto cinza
 *
 * Tamanho:
 *  - sm (default) — usado em linhas de tabela (font 11px, padding 4x10)
 *  - md — para uso em formulários
 */
type Variant = "on" | "off";
type Size = "sm" | "md";

type Props = {
  variant: Variant;
  label: string;
  size?: Size;
  /** Mostra um ponto colorido antes do texto (default: true). */
  showDot?: boolean;
  style?: CSSProperties;
};

export function StatusBadge({
  variant,
  label,
  size = "sm",
  showDot = true,
  style,
}: Props) {
  const className = `wp-status-badge wp-status-badge--${variant} wp-status-badge--${size}`;
  return (
    <span className={className} style={style}>
      {showDot && <span className="wp-status-badge-dot" aria-hidden="true" />}
      {label}
    </span>
  );
}
