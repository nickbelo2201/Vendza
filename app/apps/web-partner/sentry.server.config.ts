/**
 * Configuração do Sentry para o servidor Node.js — web-partner.
 * Carregado pelo hook de instrumentação do Next.js no runtime nodejs.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Desabilitado quando DSN não está configurado — não quebra em dev local
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
