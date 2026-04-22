/**
 * Configuração do Sentry para o runtime Edge — web-partner.
 * Carregado pelo hook de instrumentação do Next.js no runtime edge.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Desabilitado quando DSN não está configurado — não quebra em dev local
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
