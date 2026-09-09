import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_NAME } from "@/lib/constants";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "A student-native peer support board. Share a thought. Reply with kindness.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
