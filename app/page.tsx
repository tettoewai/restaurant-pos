import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center flex-col items-center">
      <h1 className="text-green-500 text-xl p-4">Welcome page</h1>
      <div className="flex justify-center items-center mt-32">
        <Link href={"/backoffice/dashboard"}>
          <button className="bg-blue-300 m-2 rounded-sm p-2">Backoffice</button>
        </Link>
        <Link href={"/order"}>
          <button className="bg-orange-300 m-2 rounded-sm p-2">Order</button>
        </Link>
      </div>
    </div>
  );
}
