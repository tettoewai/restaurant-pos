import { Dispatch, SetStateAction } from "react";
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosNotifications,
  IoMdClose,
} from "react-icons/io";
import { IoMenu } from "react-icons/io5";
import UserProfile from "./UserProfile";
import { Button, Tooltip } from "@nextui-org/react";
import { FullScreenButton, ModeButton } from "./Buttons";
interface Props {
  sideBarOpen: boolean;
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
}
export default function TopBar({ sideBarOpen, setSideBarOpen }: Props) {
  return (
    <div className="top-bar z-10">
      <div className="content bg-background">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="flex lg:hidden w-10 h-10 cursor-pointer m-1 items-center p-1 text-primary"
            onClick={() => setSideBarOpen(!sideBarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            {sideBarOpen ? (
              <IoMdClose className="w-full h-full" />
            ) : (
              <IoMenu className="w-full h-full" />
            )}
          </button>
          <Tooltip
            placement="bottom-start"
            content={sideBarOpen ? "Close sidebar" : "Open sidebar"}
            className="text-primary"
            showArrow={true}
            delay={1000}
          >
            <button
              type="button"
              className="hidden lg:flex w-10 h-10 cursor-pointer m-1 items-center p-2 text-primary"
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
          </Tooltip>

          <p>TTW-Restaurant POS</p>
        </div>
        <div className="flex h-full items-center mr-2">
          <FullScreenButton />
          <Tooltip
            placement="bottom"
            content="Notification"
            className="text-primary"
            showArrow={true}
            delay={1000}
          >
            <button>
              <IoIosNotifications className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1" />
            </button>
          </Tooltip>

          <ModeButton />
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
