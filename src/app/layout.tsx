import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Threat Intelligence Platform — eSentire PM Assignment",
  description:
    "A prototype threat intelligence search and knowledge graph exploration tool. Built as a PM assignment for eSentire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <GlobalShortcuts />
        {children}
      </body>
    </html>
  );
}
