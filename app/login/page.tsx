import { Suspense } from "react";
import SignInButton from "../order/components/SignInButton";

export default function SignIn() {
  return (
    <div className="flex justify-center items-center h-screen">
      <main className="w-full flex justify-center items-center">
        <div className="bg-background border-primary flex w-80 h-40 shadow-md rounded-md flex-col justify-center items-center">
          <h1 className="mb-9">Sign In</h1>
          <Suspense>
            <SignInButton />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
