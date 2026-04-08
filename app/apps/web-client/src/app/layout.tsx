import type { Metadata } from "next";
import { Suspense } from "react";

import { CarrinhoProvider } from "../context/CarrinhoContext";
import { Header } from "../components/Header";
import { fetchStorefrontConfig } from "../lib/api";

import "./globals.css";

// Força SSR on-demand — evita build-time fetch que trava se a API estiver dormindo
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vendza",
  description: "Compre online com facilidade.",
};

type StorefrontConfig = {
  branding: { name: string };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let nomeLoja = "Vendza";
  try {
    const config = await fetchStorefrontConfig<StorefrontConfig>("/storefront/config");
    nomeLoja = config.branding.name;
  } catch {
    // silencia erros no layout para não travar toda a app
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Evita flash de tema incorreto antes da hidratação */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('vendza-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        <CarrinhoProvider>
          <div className="wc-shell">
            <Suspense fallback={<header className="wc-header" />}>
              <Header nomeLoja={nomeLoja} />
            </Suspense>
            <div className="wc-content-area">
              <main className="wc-main">{children}</main>
            </div>
            <footer className="wc-footer">
              &copy; {nomeLoja} — Venda exclusiva para maiores de 18 anos.
            </footer>
          </div>
        </CarrinhoProvider>
      </body>
    </html>
  );
}
