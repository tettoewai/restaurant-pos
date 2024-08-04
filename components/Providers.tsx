"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import React, { ReactNode } from "react";
import { NextUIProvider } from "@nextui-org/react";

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  return (
    <SessionProvider>
      <NextUIProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </NextUIProvider>
    </SessionProvider>
  );
};
