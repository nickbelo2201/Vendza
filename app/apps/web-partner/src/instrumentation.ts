/**
 * Hook de instrumentação do Next.js.
 * Carrega a configuração correta do Sentry de acordo com o runtime ativo.
 *
 * Referência: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
