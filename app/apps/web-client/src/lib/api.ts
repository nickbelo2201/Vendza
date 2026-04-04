const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function fetchStorefront<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, { cache: "no-store", ...options });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  const json = await res.json();
  return json.data as T;
}
