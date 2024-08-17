import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Ubuntu } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { createDefaultData, fetchUser } from "./lib/data";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  const session = await getServerSession();
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const user = await fetchUser();
  if (!user && userEmail && userName) {
    createDefaultData({ email: userEmail, name: userName });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ubantu.className}>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
