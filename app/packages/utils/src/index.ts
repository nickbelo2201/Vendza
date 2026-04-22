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
