export function calcularPrecoComFardo(params: {
  quantidade: number;
  precoAvulsoCents: number;
  bundlePriceCents: number;
  quantidadeFardo: number;
}): {
  totalCents: number;
  fardosCompletos: number;
  unidadesRestantes: number;
  temDesconto: boolean;
} {
  const { quantidade, precoAvulsoCents, bundlePriceCents, quantidadeFardo } = params;
  const fardosCompletos = Math.floor(quantidade / quantidadeFardo);
  const unidadesRestantes = quantidade % quantidadeFardo;
  const totalCents = fardosCompletos * bundlePriceCents + unidadesRestantes * precoAvulsoCents;
  const temDesconto = fardosCompletos > 0 && bundlePriceCents < quantidadeFardo * precoAvulsoCents;
  return { totalCents, fardosCompletos, unidadesRestantes, temDesconto };
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function buildApiUrl(pathname: string) {
  const maybeProcess = globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  const baseUrl =
    maybeProcess.process?.env?.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3333";

  return `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
