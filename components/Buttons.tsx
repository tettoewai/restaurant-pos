"use client";

import { Button, Tooltip } from "@heroui/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoScreenFull, GoScreenNormal } from "react-icons/go";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import screenfull from "screenfull";
import ShortcutButton from "./ShortCut";
import Link from "next/link";

export const FullScreenButton = () => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  useEffect(() => {
    if (screenfull.isEnabled) {
      setIsFullScreen(screenfull.isFullscreen);
    }
  }, []);
  return (
    <>
      {isFullScreen ? (
        <Tooltip
          placement="bottom"
          content="Exit Fullscreen"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <Button
            isIconOnly
            variant="light"
            onPress={() => {
              screenfull.isEnabled && screenfull.exit();
              setIsFullScreen(false);
            }}
          >
            <GoScreenNormal className="size-7 md:size-8 cursor-pointer text-primary p-1" />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip
          placement="bottom"
          content="Go Fullscreen"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <Button
            isIconOnly
            variant="light"
            onPress={() => {
              screenfull.isEnabled && screenfull.request();
              setIsFullScreen(true);
            }}
          >
            <GoScreenFull className="size-7 md:size-8 cursor-pointer text-primary p-1" />
          </Button>
        </Tooltip>
      )}
    </>
  );
};

export function ModeButton() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <>
      {resolvedTheme === "dark" ? (
        <Tooltip
          placement="bottom-end"
          content="Dark mode"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <Button isIconOnly variant="light" onPress={() => setTheme("light")}>
            <MdDarkMode className="size-7 md:size-8 cursor-pointer text-primary p-1" />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip
          placement="bottom-end"
          content="Light mode"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <Button isIconOnly variant="light" onPress={() => setTheme("dark")}>
            <MdLightMode className="size-7 md:size-8 cursor-pointer text-primary p-1" />
          </Button>
        </Tooltip>
      )}
    </>
  );
}

export function NewPromtionButton() {
  const router = useRouter();
  return (
    <Button
      className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      onPress={() => router.push("/backoffice/promotion/new")}
    >
      <ShortcutButton
        onPress={() => router.push("/backoffice/promotion/new")}
        keys={["ctrl"]}
        letter="O"
      />
      New Promotion
    </Button>
  );
}
