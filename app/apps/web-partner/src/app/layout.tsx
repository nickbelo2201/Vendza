import type { Metadata } from "next";

import "./globals.css";
import { OfflineBanner } from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "Vendza Partner",
  description: "Painel parceiro para operadores de comércio.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A7A5E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vendza-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t||d);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
