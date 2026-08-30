// ============================================================
// FILE (RISCRITTO): app/layout.tsx
// ============================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nelis PM",
  description: "Gestione cantieri e cronoprogrammi Nelis",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      {/* suppressHydrationWarning: alcune estensioni browser (es. ColorZilla)
          iniettano attributi nel DOM prima dell'hydration, causando un
          warning innocuo ma rumoroso in console. */}
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}