import { Suspense } from "react";
import CartContent from "./CartContent";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex justify-center items-center h-80">
          <span>Loading cart...</span>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
