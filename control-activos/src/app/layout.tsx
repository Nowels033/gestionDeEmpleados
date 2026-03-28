import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_LOGO_PATH,
} from "@/lib/brand";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: BRAND_TAGLINE,
  icons: {
    icon: BRAND_LOGO_PATH,
    shortcut: BRAND_LOGO_PATH,
    apple: BRAND_LOGO_PATH,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
        <body
        className={`${manrope.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
