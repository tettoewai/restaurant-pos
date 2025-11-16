import { Spinner } from "@heroui/react";
import React from "react";

export default function LoadingSpiner({ text }: { text: string }) {
  return (
    <div>
      <span>{`${text}...`}</span>
      <Spinner color="primary" size="sm" variant="wave" />
    </div>
  );
}
