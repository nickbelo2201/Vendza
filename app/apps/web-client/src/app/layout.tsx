import type { Metadata } from "next";

import { CarrinhoProvider } from "../context/CarrinhoContext";
import { Header } from "../components/Header";
import { fetchStorefront } from "../lib/api";

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
    const config = await fetchStorefront<StorefrontConfig>("/storefront/config");
    nomeLoja = config.branding.name;
  } catch {
    // silencia erros no layout para não travar toda a app
  }

  return (
    <html lang="pt-BR">
      <body>
        <CarrinhoProvider>
          <div className="wc-shell">
            <Header nomeLoja={nomeLoja} />
            <main className="wc-main" style={{ paddingTop: 24 }}>{children}</main>
            <footer className="wc-footer">
              &copy; {nomeLoja} — Venda exclusiva para maiores de 18 anos.
            </footer>
          </div>
        </CarrinhoProvider>
      </body>
    </html>
  );
}
