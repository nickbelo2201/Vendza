/**
 * Inicialização do Sentry para monitoramento de erros no backend.
 *
 * Este arquivo DEVE ser importado como o PRIMEIRO import em server.ts
 * para garantir que o Sentry intercepte todos os erros desde o startup.
 *
 * A variável SENTRY_DSN deve ser configurada no ambiente de produção.
 * Se não estiver definida, o Sentry fica desabilitado (não quebra em dev local).
 */
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  // Desabilitado quando DSN não está configurado — não quebra em dev local
  enabled: !!process.env.SENTRY_DSN,
  // Captura 10% das transações para performance monitoring
  tracesSampleRate: 0.1,
});
