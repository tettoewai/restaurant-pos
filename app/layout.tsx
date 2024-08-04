import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { createDefaultData, fetchUser } from "./lib/data";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
