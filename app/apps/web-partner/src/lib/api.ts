const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  // No contexto do servidor (Server Components), usa supabase/server que lê cookies via import dinâmico
  // Isso evita que next/headers seja incluído no bundle do cliente
  if (typeof window === "undefined") {
    try {
      const { createClient } = await import("../utils/supabase/server");
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }
  // No contexto do cliente (Client Components), não há acesso ao token server-side
  // O token será obtido via cookie HttpOnly pelo middleware ou não é necessário (rotas públicas)
  return null;
}

type FetchAPIOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function fetchAPI<T>(path: string, options: FetchAPIOptions = {}): Promise<T> {
  const token = await getAccessToken();

  const { body, headers: extraHeaders, ...restOptions } = options;

  const res = await fetch(`${API_URL}/v1${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}
