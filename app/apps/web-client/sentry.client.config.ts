/**
 * Configuração do Sentry para o cliente (browser) — web-client.
 * Carregado automaticamente pelo Next.js no lado do browser.
 *
 * NEXT_PUBLIC_SENTRY_DSN deve ser configurado nas variáveis de ambiente
 * do Vercel. Se não estiver definido, o Sentry fica desabilitado.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Desabilitado quando DSN não está configurado — não quebra em dev local
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Captura 10% das transações para performance monitoring
  tracesSampleRate: 0.1,
});
