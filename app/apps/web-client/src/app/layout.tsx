import type { Metadata } from "next";

import { CarrinhoProvider } from "../context/CarrinhoContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { fetchStorefrontConfig } from "../lib/api";

import "./globals.css";

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
            <Header nomeLoja={nomeLoja} />
            <div className="wc-content-area">
              <Sidebar />
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
