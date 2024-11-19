"use client";

import { useEffect } from "react";
import { Button, Kbd, KbdKey } from "@nextui-org/react";

interface ShortcutButtonProps {
  keys: KbdKey[];
  onClick: () => void;
  letter: string;
}

const ShortcutButton: React.FC<ShortcutButtonProps> = ({
  keys,
  onClick,
  letter,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlPressed = keys.includes("command") && event.ctrlKey;
      const letterPressed = letter.toLowerCase() === event.key.toLocaleLowerCase()
      if (ctrlPressed && letterPressed) {
        event.preventDefault(); // Prevent Chrome's default behavior
        onClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keys, onClick]);

  return (
    <Kbd keys={keys} className="bg-transparent border-0">
        {letter}
      </Kbd>
  );
};

export default ShortcutButton;
