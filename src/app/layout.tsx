import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EGX Pro - Egyptian Stock Valuation Platform",
  description: "Institutional-grade Egyptian stock valuation platform with 8 valuation models, technical analysis, AI reports, and comprehensive financial metrics for the EGX.",
  keywords: ["EGX", "Egyptian Stock Exchange", "Valuation", "DCF", "Technical Analysis", "AI Report", "Financial Metrics", "CIB", "COMI"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#0a0e17', color: '#e2e8f0' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
