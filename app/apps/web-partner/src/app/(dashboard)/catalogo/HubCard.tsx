"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

type HubCardProps = {
  href: string;
  icone: ReactNode;
  titulo: string;
  descricao: string;
};

export function HubCard({ href, icone, titulo, descricao }: HubCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "20px 20px 18px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--green)",
        flexShrink: 0,
      }}>
        {icone}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--carbon)", marginBottom: 4 }}>
          {titulo}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
          {descricao}
        </div>
      </div>
    </Link>
  );
}
