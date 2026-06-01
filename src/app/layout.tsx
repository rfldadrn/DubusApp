import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { AppSessionProvider } from "@/components/shared/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Toko Jahit App",
  description: "Sistem Manajemen Toko Jahit Modern",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AppSessionProvider>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </AppSessionProvider>
      </body>
    </html>
  );
}
