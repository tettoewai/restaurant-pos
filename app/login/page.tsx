"use client";
import { Button } from "@heroui/react";
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-background border-primary flex w-80 h-40 shadow-md rounded-md flex-col justify-center items-center">
        <h1 className="mb-9">Sign In</h1>
        <Button
          onPress={() =>
            signIn("google", { callbackUrl: "/backoffice/dashboard" })
          }
          className="bg-primary rounded-md w-52 h-10 text-white"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
