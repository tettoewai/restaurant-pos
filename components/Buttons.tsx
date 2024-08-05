"use client";

import {
  Button,
  DropdownItem,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GoScreenFull, GoScreenNormal } from "react-icons/go";
import { MdDarkMode, MdEdit, MdLightMode } from "react-icons/md";
import screenfull from "screenfull";
import UpdateMenuDialog from "./UpdateMenuDailog";
import { MenuCategory } from "@prisma/client";
import NewMenuCategoryDialog from "./NewMenuCategoryDailog";

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
          <button>
            <GoScreenNormal
              className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1"
              onClick={() => {
                screenfull.isEnabled && screenfull.exit();
                setIsFullScreen(false);
              }}
            />
          </button>
        </Tooltip>
      ) : (
        <Tooltip
          placement="bottom"
          content="Go Fullscreen"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <button>
            <GoScreenFull
              className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1"
              onClick={() => {
                screenfull.isEnabled && screenfull.request();
                setIsFullScreen(true);
              }}
            />
          </button>
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
          placement="bottom"
          content="Dark mode"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <button>
            <MdDarkMode
              className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1"
              onClick={() => setTheme("light")}
            />
          </button>
        </Tooltip>
      ) : (
        <Tooltip
          placement="bottom"
          content="Light mode"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <button>
            <MdLightMode
              className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1"
              onClick={() => setTheme("dark")}
            />
          </button>
        </Tooltip>
      )}
    </>
  );
}

export function NewMenuCategoryButton() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  return (
    <div>
      <Button
        onPress={onOpen}
        className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 m-2 rounded"
      >
        New Menu
      </Button>
      <NewMenuCategoryDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
      />
    </div>
  );
}
