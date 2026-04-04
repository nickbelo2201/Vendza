import { createClient } from "../utils/supabase/server";

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
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
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
