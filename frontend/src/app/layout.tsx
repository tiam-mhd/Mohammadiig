import type { Metadata } from "next";
import {
  Saira_Condensed,
  Cormorant_Garamond,
  Noto_Naskh_Arabic,
  JetBrains_Mono,
  Vazirmatn,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SiteChrome } from "@/components/SiteChrome";

/** Bugatti Display substitute — English only */
const bugattiDisplay = Saira_Condensed({
  variable: "--font-bugatti-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

/** Bugatti Text substitute — English body */
const bugattiText = Cormorant_Garamond({
  variable: "--font-bugatti-text",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

/** Bugatti Monospace substitute — English labels */
const bugattiMono = JetBrains_Mono({
  variable: "--font-bugatti-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

/** Persian display / titles */
const displayFa = Noto_Naskh_Arabic({
  variable: "--font-display-fa",
  subsets: ["arabic", "latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Persian UI / body */
const ui = Vazirmatn({
  variable: "--font-ui",
  subsets: ["arabic", "latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIG — گروه صنعتی محمدی",
  description: "طراح و سازنده تجهیزات تفریحی و راهکارهای سرگرمی برای پروژه‌های متمایز.",
  keywords: ["ماشین برقی", "تجهیزات تفریحی", "Bumper Cars", "MIG"],
  metadataBase: new URL("https://mohammadiig.ir"),
  openGraph: {
    title: "MIG — گروه صنعتی محمدی",
    description: "طراح و سازنده تجهیزات تفریحی و راهکارهای سرگرمی",
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${bugattiDisplay.variable} ${bugattiText.variable} ${bugattiMono.variable} ${displayFa.variable} ${ui.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p==="/auth"||p.indexOf("/auth/")===0||p==="/admin"||p.indexOf("/admin/")===0)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.setAttribute("data-splash","pending");}catch(e){}})();`,
          }}
        />
        <link rel="preload" as="image" href="/logo-pieces/piece-left.webp" type="image/webp" />
        <link rel="preload" as="image" href="/logo-pieces/piece-right.webp" type="image/webp" />
        <link rel="preload" as="image" href="/logo-pieces/piece-top-left.webp" type="image/webp" />
        <link rel="preload" as="image" href="/logo-pieces/piece-top-right.webp" type="image/webp" />
        <link rel="preload" as="image" href="/logo-pieces/piece-bottom-left.webp" type="image/webp" />
        <link rel="preload" as="image" href="/logo-pieces/piece-bottom-right.webp" type="image/webp" />
        <link rel="preload" as="image" href="/Logo-Gold.webp" type="image/webp" />
        <link rel="preload" as="image" href="/Background.webp" type="image/webp" />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <ThemeProvider>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
