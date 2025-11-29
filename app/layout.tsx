import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurant POS",
  description:
    "Order food online with ease. Our restaurant system lets customers browse menus, place orders, and track them in real-time.",
};

const ubantu = Ubuntu({ subsets: ["latin"], weight: "500" });
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ubantu.className} scrollbar-hide`}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
          <SpeedInsights />
        </ErrorBoundary>
      </body>
    </html>
  );
}
