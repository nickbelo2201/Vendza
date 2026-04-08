"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wc-panel">
      <h1>Algo deu errado</h1>
      <p>{error.message}</p>
      <button className="wc-button" onClick={reset} type="button">
        Tentar novamente
      </button>
    </div>
  );
}
