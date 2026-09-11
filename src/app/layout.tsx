import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_NAME } from "@/lib/constants";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "A student-native peer support board. Share a thought. Reply with kindness.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003057" },
    { media: "(prefers-color-scheme: dark)", color: "#001526" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${roboto.className} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
