import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vendza Partner",
  description: "Painel parceiro para operadores de comércio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
