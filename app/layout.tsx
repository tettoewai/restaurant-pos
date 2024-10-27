import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const ubantu = Ubuntu({ subsets: ["latin"], weight: "500" });

export const metadata: Metadata = {
  title: "Restaurant-pos",
  description: "My restaurant pos",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ubantu.className}>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
