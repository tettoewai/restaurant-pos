"use client";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { SolarProvider } from "@solar-icons/react";
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
      <SolarProvider
        value={{
          weight: "Broken",
        }}
      >
        <HeroUIProvider navigate={router.push}>
          <ToastProvider toastProps={{ timeout: 4000 }} />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </HeroUIProvider>
      </SolarProvider>
    </SessionProvider>
  );
};
