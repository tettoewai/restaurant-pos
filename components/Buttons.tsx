"use client";

import { Tooltip } from "@nextui-org/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { GoScreenFull, GoScreenNormal } from "react-icons/go";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import screenfull from "screenfull";

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
