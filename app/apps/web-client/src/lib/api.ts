const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function _fetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    signal: AbortSignal.timeout(15000),
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} em ${path}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data as T;
}

// Configuração da loja — muda raramente, revalidado a cada 5 minutos
export function fetchStorefrontConfig<T>(path: string): Promise<T> {
  return _fetch<T>(path, { next: { revalidate: 300 } });
}

// Catálogo (produtos/categorias) — revalidado a cada 60 segundos
export function fetchStorefrontCatalog<T>(path: string): Promise<T> {
  return _fetch<T>(path, { next: { revalidate: 60 } });
}

// Dados dinâmicos (pedidos, carrinho) — sempre fresco
export function fetchStorefront<T>(path: string, options?: RequestInit): Promise<T> {
  return _fetch<T>(path, { cache: "no-store", ...options });
}
