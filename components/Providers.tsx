"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import React, { ReactNode } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  const router = useRouter();
  return (
    <SessionProvider>
      <NextUIProvider navigate={router.push}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </NextUIProvider>
    </SessionProvider>
  );
};
