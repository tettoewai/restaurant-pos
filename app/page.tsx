import {
  ChecklistMinimalistic,
  CodeScan,
  Devices,
  DocumentAdd,
  HandHeart,
  MapPointFavourite,
  Notebook2,
  PeopleNearby,
} from "@solar-icons/react/ssr";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function Home() {
  const functionItem = [
    {
      icon: Devices,
      title: "Responsive in multiple devices",
    },
    {
      icon: Notebook2,
      title: "Easily manage your menus with Restaurant POS",
    },
    {
      icon: CodeScan,
      title: "Scan and order. Quick and easy! Your customers will love it!",
    },
    {
      icon: MapPointFavourite,
      title: "Restaurant POS supports multiple locations for your business",
    },
    {
      icon: ChecklistMinimalistic,
      title: "Backoffice and order apps are included in every subscription.",
    },
    {
      icon: HandHeart,
      title:
        "Dedicated customer support so that we are awlays here to help you.",
    },
    {
      icon: PeopleNearby,
      title: "Customer can only place order when physically in restaurant.",
    },
    {
      icon: DocumentAdd,
      title: "Digital receipt and rating feedback.",
    },
  ];

  return (
    <div className="flex scrollbar-hide flex-col items-center bg-gray-200 dark:bg-gray-950 h-screen overflow-auto w-full">
      <main className="flex flex-col items-center w-full">
        <div
          className={`flex items-center justify-center flex-col ${bebasNeue.className}`}
        >
          <h1 className="text-primary text-2xl mt-5">TTW-Restaurant POS</h1>
          <h1 className="text-lg">The revolution of POS</h1>
        </div>
        <div className="mt-16 max-w-96">
          <h1 className="text-wrap m-4 text-center font-bold text-lg">
            Manage your menu catelog easily with Restaurant POS and entice your
            customers with QR code ordering system
          </h1>
        </div>
        <div className="flex justify-center items-center mt-28">
          <Link
            className="bg-primary m-2 rounded-md p-2 px-2 text-white"
            href={"backoffice/order"}
          >
            Backoffice
          </Link>
          <Link
            className="bg-white m-2 rounded-md p-2 px-2 text-red-500"
            href={`warehouse`}
          >
            Warehouse
          </Link>
          <Link
            className="bg-orange-600 m-2 rounded-md p-2 px-2 text-white"
            href={`/order?tableId=1`}
          >
            Order
          </Link>
        </div>
        <span>In usage, user must scan qr code to place order</span>
        <div className="mt-9 flex items-center justify-center flex-wrap">
          {functionItem.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="w-52 h-44 flex items-center justify-center flex-col bg-background rounded-md m-3 hover:scale-105 transition-transform"
              >
                <Icon className="text-primary size-10" />
                <h5 className="text-center mt-2">{item.title}</h5>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
