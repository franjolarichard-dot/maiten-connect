import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MaitenConnect | Servicios Locales",
  description: "Encuentra y solicita servicios en Maitencillo, Cachagua, Zapallar y Papudo en segundos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} min-h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300 pt-16">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
