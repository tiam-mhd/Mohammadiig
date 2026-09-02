import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIG - گروه صنعتی محمدی",
  description: "تولیدکننده تجهیزات تفریحی و ماشین های برقی | MIG Industrial Group",
  keywords: ["ماشین برقی", "تجهیزات تفریحی", "Bumper Cars", "MIG"],
  metadataBase: new URL("https://mohammadiig.ir"),
  openGraph: {
    title: "MIG - گروه صنعتی محمدی",
    description: "تولیدکننده تجهیزات تفریحی و ماشین های برقی",
    url: "https://mohammadiig.ir",
    siteName: "MIG Industrial Group",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
