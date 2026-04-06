"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Opcao = { label: string; dias: number };

const OPCOES: Opcao[] = [
  { label: "Hoje", dias: 0 },
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
];

function formatarData(d: Date): string {
  return d.toISOString().substring(0, 10);
}

export function SeletorPeriodo({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hoje = formatarData(new Date());
  const isHoje = from === hoje && to === hoje;
  const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));

  function selecionar(dias: number) {
    const params = new URLSearchParams(searchParams.toString());
    const agora = new Date();
    const toDate = formatarData(agora);
    const fromDate = dias === 0 ? toDate : formatarData(new Date(agora.getTime() - dias * 86400000));
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/relatorios?${params.toString()}`);
  }

  function isAtivo(dias: number): boolean {
    if (dias === 0) return isHoje;
    if (dias === 7) return !isHoje && diff === 7;
    if (dias === 30) return !isHoje && diff === 30;
    return false;
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {OPCOES.map((op) => (
        <button
          key={op.dias}
          type="button"
          onClick={() => selecionar(op.dias)}
          className={isAtivo(op.dias) ? "wp-badge wp-badge-blue" : "wp-badge wp-badge-muted"}
          style={{
            cursor: "pointer", border: "none", fontFamily: "inherit",
            fontSize: 12, fontWeight: isAtivo(op.dias) ? 700 : 500,
            padding: "4px 14px", borderRadius: 6, transition: "all 0.15s",
          }}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}
