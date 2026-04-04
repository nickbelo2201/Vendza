"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wp-panel">
      <h1>Falha no painel parceiro</h1>
      <p>{error.message}</p>
      <button className="wp-button" onClick={reset} type="button">
        Tentar novamente
      </button>
    </div>
  );
}
