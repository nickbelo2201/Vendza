/**
 * Converte qualquer URL de imagem externa para passar pelo proxy interno.
 * Resolve CORS e bloqueios de Referer com Open Food Facts e Wikimedia.
 */
export function proxyImage(
  externalUrl: string | null | undefined
): string | null {
  if (!externalUrl) return null;
  return `/api/image-proxy?url=${encodeURIComponent(externalUrl)}`;
}
