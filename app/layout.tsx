import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.universopt.com.br"),
  title: {
    default: "UPT — Universo Priston Tale",
    template: "%s",
  },
  description:
    "Entre no Universo Priston Tale. Acompanhe eventos, notícias, UPT Shop, status do servidor e prepare-se para baixar o cliente oficial.",
  applicationName: "Universo Priston Tale",
  keywords: ["Priston Tale", "UPT", "MMORPG", "Universo Priston Tale", "jogo online"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.universopt.com.br",
    siteName: "Universo Priston Tale",
    title: "UPT — Entre no Universo. Escreva sua lenda.",
    description: "Um novo universo de aventuras, batalhas e comunidade está sendo preparado.",
    images: [{ url: "/upt-hero.webp", width: 1672, height: 941, alt: "Universo Priston Tale" }],
  },
  other: {
    "codex-preview": "development",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
