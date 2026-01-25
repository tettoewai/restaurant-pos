"use client";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { SolarProvider } from "@solar-icons/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { SocketProvider } from "@/context/SocketContext";

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  const router = useRouter();
  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <ToastProvider toastProps={{ timeout: 4000 }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SolarProvider
            value={{
              weight: "Broken",
            }}
          >
            <SocketProvider>
              {children}
            </SocketProvider>
          </SolarProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
};
