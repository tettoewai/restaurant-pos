import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center flex-col items-center">
      <h1 className="text-primary text-xl p-4">Welcome page</h1>
      <div className="flex justify-center items-center mt-32">
        <Link href={"/backoffice/dashboard"}>
          <Button className="bg-primary m-2 rounded-sm p-2">Backoffice</Button>
        </Link>
        <Link href={"/order?tableId=1"}>
          <Button className="bg-orange-300 m-2 rounded-sm p-2">Order</Button>
        </Link>
      </div>
    </div>
  );
}
