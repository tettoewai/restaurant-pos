"use client";
import { Button } from "@heroui/react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInButton() {
  const serachParams = useSearchParams();
  const callbackUrl = serachParams.get("callbackUrl") || "/";
  return (
    <Button
      onPress={() => signIn("google", { callbackUrl })}
      className="bg-primary rounded-md w-52 h-10 text-white"
    >
      Sign in with Google
    </Button>
  );
}
