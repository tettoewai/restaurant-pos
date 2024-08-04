import { Dispatch, SetStateAction } from "react";
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosNotifications,
  IoMdClose,
} from "react-icons/io";
import { IoMenu } from "react-icons/io5";
import { FullScreenButton } from "./FullScreenButton";
import ModeButton from "./ModeButton";
import UserProfile from "./UserProfile";
import { Button } from "@nextui-org/react";
interface Props {
  sideBarOpen: boolean;
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
}
export default function TopBar({ sideBarOpen, setSideBarOpen }: Props) {
  return (
    <div className="top-bar">
      <div className="content bg-white dark:dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="flex lg:hidden w-10 h-10 cursor-pointer m-1 items-center p-1 text-red-500"
            onClick={() => setSideBarOpen(!sideBarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            {sideBarOpen ? (
              <IoMdClose className="w-full h-full" />
            ) : (
              <IoMenu className="w-full h-full" />
            )}
          </button>
          <button
            type="button"
            className="hidden lg:flex w-10 h-10 cursor-pointer m-1 items-center p-2 text-red-500"
            onClick={() => {
              setSideBarOpen(!sideBarOpen);
            }}
          >
            <span className="sr-only">Open sidebar</span>
            {sideBarOpen ? (
              <IoIosArrowBack className="w-full h-full" />
            ) : (
              <IoIosArrowForward className="w-full h-full" />
            )}
          </button>
          <p>TTW-Restaurant POS</p>
        </div>
        <div className="flex h-full items-center mr-2">
          <FullScreenButton />
          <IoIosNotifications className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-red-500 p-1" />
          <ModeButton />
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
