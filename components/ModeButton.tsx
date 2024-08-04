"use clent";

import { useTheme } from "next-themes";
import { MdDarkMode, MdLightMode } from "react-icons/md";

const ModeButton = () => {
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
};

export default ModeButton;
