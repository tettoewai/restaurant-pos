"use client";

import { useEffect } from "react";
import { Button, Kbd, KbdKey } from "@heroui/react";

interface ShortcutButtonProps {
  keys: KbdKey[];
  onPress: () => void;
  letter: string;
}

const ShortcutButton = ({ keys, onPress, letter }: ShortcutButtonProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlPressed = keys.includes("ctrl") && event.ctrlKey;
      const letterPressed =
        event.key && letter.toLowerCase() === event.key.toLocaleLowerCase();
      if (ctrlPressed && letterPressed) {
        event.preventDefault(); // Prevent Chrome's default behavior
        onPress();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keys, onPress, letter]);

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
