"use client";

/**
 * Componente de erro global para capturar falhas em Server Components.
 * Reporta automaticamente ao Sentry e exibe uma mensagem amigável ao usuário.
 *
 * Referência: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-global-errors
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <h1>Algo deu errado</h1>
      </body>
    </html>
  );
}
