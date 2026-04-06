import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/lib/theme";
import { Analytics } from "@vercel/analytics/react";
import OfflineBanner from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "MiFinanzas — Control de Gastos Personales",
  description: "Registra tus gastos, configura presupuestos por categoria, y manten el control de tus finanzas personales.",
  manifest: "/manifest.json",
  openGraph: {
    title: "MiFinanzas — Control de Gastos Personales",
    description: "Registra tus gastos, configura presupuestos por categoria, y manten el control de tus finanzas personales.",
    type: "website",
    locale: "es_LA",
  },
  twitter: {
    card: "summary",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MiFinanzas",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#F2F2F7] dark:bg-black min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <OfflineBanner />
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegistrar />
        <Analytics />
      </body>
    </html>
  );
}
