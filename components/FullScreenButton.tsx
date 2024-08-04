"use client";

import { useEffect, useState } from "react";
import { GoScreenFull, GoScreenNormal } from "react-icons/go";
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
          className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1"
          onClick={() => {
            screenfull.isEnabled && screenfull.exit();
            setIsFullScreen(false);
          }}
        />
      ) : (
        <GoScreenFull
          className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1"
          onClick={() => {
            screenfull.isEnabled && screenfull.request();
            setIsFullScreen(true);
          }}
        />
      )}
    </>
  );
};
