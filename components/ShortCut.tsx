"use client";

import { useEffect } from "react";
import { Button, Kbd, KbdKey } from "@nextui-org/react";

interface ShortcutButtonProps {
  keys: KbdKey[];
  onClick: () => void;
  letter: string;
}

const ShortcutButton = ({ keys, onClick, letter }: ShortcutButtonProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlPressed = keys.includes("command") && event.ctrlKey;
      const letterPressed =
        event.key && letter.toLowerCase() === event.key.toLocaleLowerCase();
      if (ctrlPressed && letterPressed) {
        event.preventDefault(); // Prevent Chrome's default behavior
        onClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keys, onClick, letter]);

  return (
    <Kbd
      keys={keys}
      classNames={{
        base: "bg-transparent border-0 shadow-none hidden md:flex",
      }}
    >
      {letter}
    </Kbd>
  );
};

export default ShortcutButton;
