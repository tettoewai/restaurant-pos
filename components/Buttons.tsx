"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
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
        <GoScreenNormal
          className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-red-500 p-1"
          onClick={() => {
            screenfull.isEnabled && screenfull.exit();
            setIsFullScreen(false);
          }}
        />
      ) : (
        <GoScreenFull
          className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-red-500 p-1"
          onClick={() => {
            screenfull.isEnabled && screenfull.request();
            setIsFullScreen(true);
          }}
        />
      )}
    </>
  );
};

function ModeButton() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <>
      {resolvedTheme === "dark" ? (
        <MdDarkMode
          className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-red-500 p-1"
          onClick={() => setTheme("light")}
        />
      ) : (
        <MdLightMode
          className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-red-500 p-1"
          onClick={() => setTheme("dark")}
        />
      )}
    </>
  );
}

export default ModeButton;