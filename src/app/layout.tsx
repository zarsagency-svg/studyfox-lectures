import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { APP_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: "STUDY FOX",
  description: `${APP_CONFIG.NAME} ${APP_CONFIG.CONTACT_DESCRIPTION}`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://static.pw.live" />
        <link rel="preconnect" href="https://spark.mscilearn.in" />
        <link rel="dns-prefetch" href="https://static.pw.live" />
        <link rel="dns-prefetch" href="https://spark.mscilearn.in" />
      </head>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
