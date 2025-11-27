"use client";

import { Button, Tooltip } from "@heroui/react";
import { PurchaseOrder } from "@prisma/client";
import {
  FullScreen,
  MoonStars,
  PenNewSquare,
  QuitFullScreen,
  Sun2,
} from "@solar-icons/react/ssr";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import screenfull from "screenfull";
import ShortcutButton from "./ShortCut";

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
            <QuitFullScreen className="size-7 md:size-8 cursor-pointer text-primary p-1" />
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
            <FullScreen className="size-7 md:size-8 cursor-pointer text-primary p-1" />
          </Button>
        </Tooltip>
      )}
    </>
  );
};

export function ModeButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR to match initial client render
  if (!mounted) {
    return (
      <Button isIconOnly variant="light" aria-label="Theme toggle">
        <Sun2 className="size-7 md:size-8 cursor-pointer text-primary p-1" />
      </Button>
    );
  }

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
            <MoonStars className="size-7 md:size-8 cursor-pointer text-primary p-1" />
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
            <Sun2 className="size-7 md:size-8 cursor-pointer text-primary p-1" />
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

export function EditPOButton({ item }: { item: PurchaseOrder }) {
  const router = useRouter();
  return (
    <Button
      isIconOnly
      variant="light"
      onPress={() => router.push(`/warehouse/purchase-order/${item.id}`)}
    >
      <PenNewSquare className="size-5" />
    </Button>
  );
}

export function NewPOButton() {
  const router = useRouter();
  return (
    <Button
      color="primary"
      onPress={() => router.push("/warehouse/purchase-order/new")}
    >
      Create New PO
    </Button>
  );
}

export function CorrectionPOBtn({ item }: { item: PurchaseOrder }) {
  const router = useRouter();
  return (
    <Button
      onPress={() =>
        router.push(`/warehouse/purchase-order/${item.id}/correction`)
      }
      size="sm"
      color="warning"
      variant="light"
      className="text-warning"
    >
      Correction
    </Button>
  );
}
