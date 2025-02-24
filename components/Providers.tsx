"use client";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  const router = useRouter();
  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <ToastProvider toastProps={{ timeout: 5000 }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
};
