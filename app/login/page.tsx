"use client";
import { Button } from "@nextui-org/react";
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex w-80 h-40 shadow-md rounded-md flex-col justify-center items-center">
        <h1 className="mb-9">Sign In</h1>
        <Button
          onClick={() =>
            signIn("google", { callbackUrl: "/backoffice/dashboard" })
          }
          className="bg-cyan-500 hover:bg-cyan-600 rounded-md w-52 h-10 text-white"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
