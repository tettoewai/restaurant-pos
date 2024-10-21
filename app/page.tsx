import { Button } from "@nextui-org/react";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { BiSolidFoodMenu } from "react-icons/bi";
import { BsQrCodeScan } from "react-icons/bs";
import { MdAddLocationAlt, MdOutlineDevices } from "react-icons/md";
import {
  RiCheckboxMultipleBlankFill,
  RiCustomerService2Line,
} from "react-icons/ri";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default async function Home() {
  const functionItem = [
    {
      icon: <MdOutlineDevices className="text-primary size-10" />,
      title: "Responsive in multiple devices",
    },
    {
      icon: <BiSolidFoodMenu className="text-primary size-10" />,
      title: "Easily manage your menus with Restaurant POS",
    },
    {
      icon: <BsQrCodeScan className="text-primary size-10" />,
      title: "Scan and order. Quick and easy! Your customers will love it!",
    },
    {
      icon: <MdAddLocationAlt className="text-primary size-10" />,
      title: "Restaurant POS supports multiple locations for your business",
    },
    {
      icon: <RiCheckboxMultipleBlankFill className="text-primary size-10" />,
      title: "Backoffice and order apps are included in every subscription.",
    },
    {
      icon: <RiCustomerService2Line className="text-primary size-10" />,
      title:
        "Dedicated customer support so that we are awlays here to help you.",
    },
  ];

  return (
    <div className="flex  flex-col items-center bg-gray-200 dark:bg-gray-950 h-screen overflow-auto w-full">
      <h1
        className={`text-primary font-bold text-xl mt-5 ${bebasNeue.className}`}
      >
        TTW-Restaurant POS
      </h1>
      <div className="mt-16 max-w-96">
        <h1 className="text-wrap m-4 text-center font-bold text-lg">
          Manage your menu catelog easily with Restaurant POS and entice your
          customers with QR code ordering system
        </h1>
      </div>
      <div className="flex justify-center items-center mt-28">
        <Link href={"/backoffice/order"}>
          <Button className="bg-primary m-2 rounded-sm p-2 text-white">
            Backoffice
          </Button>
        </Link>
        <Link href={`/order?tableId=1`}>
          <Button className="bg-orange-300 m-2 rounded-sm p-2 text-white">
            Order
          </Button>
        </Link>
      </div>
      <span>In usage, user must be scan qr code to place order</span>
      <div className="mt-9 flex items-center justify-center flex-wrap">
        {functionItem.map((item, index) => (
          <div
            key={index}
            className="w-52 h-44 flex items-center justify-center flex-col bg-background rounded-md m-3 hover:scale-105 transition-transform"
          >
            {item.icon}
            <h5 className="text-center mt-2">{item.title}</h5>
          </div>
        ))}
      </div>
    </div>
  );
}
