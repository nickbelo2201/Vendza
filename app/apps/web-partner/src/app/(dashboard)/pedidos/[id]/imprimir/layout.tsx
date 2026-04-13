/**
 * Layout isolado para a página de impressão de comanda.
 * Não herda sidebar, topbar nem qualquer elemento do dashboard.
 */
export default function ImprimirLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Comanda</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #fff;
            color: #000;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            line-height: 1.5;
          }
          @media print {
            body { background: #fff !important; }
            @page { margin: 10mm; }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
