import { Link as NextUiLink } from "@heroui/react";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { BiSolidFoodMenu } from "react-icons/bi";
import { BsQrCodeScan } from "react-icons/bs";
import { FaUserShield } from "react-icons/fa6";
import { MdAddLocationAlt, MdOutlineDevices } from "react-icons/md";
import {
  RiCheckboxMultipleBlankFill,
  RiCustomerService2Line,
} from "react-icons/ri";
import { VscFeedback } from "react-icons/vsc";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function Home() {
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
    {
      icon: <FaUserShield className="text-primary size-10" />,
      title: "Customer can only place order when physically in restaurant.",
    },
    {
      icon: <VscFeedback className="text-primary size-10" />,
      title: "Digital receipt and rating feedback.",
    },
  ];

  return (
    <div className="flex scrollbar-hide flex-col items-center bg-gray-200 dark:bg-gray-950 h-screen overflow-auto w-full">
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
        <NextUiLink
          as={Link}
          className="bg-primary m-2 rounded-md p-2 px-2 text-white"
          href={"/backoffice/order"}
        >
          Backoffice
        </NextUiLink>
        <NextUiLink
          as={Link}
          className="bg-white m-2 rounded-md p-2 px-2 text-red-500"
          href={`/warehouse`}
        >
          Warehouse
        </NextUiLink>
        <NextUiLink
          as={Link}
          className="bg-orange-600 m-2 rounded-md p-2 px-2 text-white"
          href={`/order?tableId=1`}
        >
          Order
        </NextUiLink>
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
