import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Solar ERP — Gestión de Energía Solar",
  description: "Plataforma de gestión integral para empresas de energía solar. Administra instalaciones, clientes, mantenimiento e inventario.",
  keywords: ["solar", "ERP", "energía", "instalaciones", "gestión"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
