import { Divider, Tooltip } from "@nextui-org/react";
import { Dispatch, SetStateAction } from "react";
import { IoIosArrowBack, IoIosArrowForward, IoMdClose } from "react-icons/io";
import { IoMenu } from "react-icons/io5";
import { FullScreenButton, ModeButton } from "./Buttons";
import LocationToggle from "./LocationToggle";
import NotificationFeed from "./NotificationFeed";
import UserProfile from "./UserProfile";
import useSWR from "swr";
import { fetchCompany } from "@/app/lib/backoffice/data";
interface Props {
  sideBarOpen: boolean;
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
}
export default function TopBar({ sideBarOpen, setSideBarOpen }: Props) {
  const isUpdateCompany =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateCompany")
      : null;
  const { data } = useSWR(`company${isUpdateCompany}`, () => fetchCompany());
  return (
    <div className="top-bar z-30">
      <div className="content bg-background flex items-center">
        <div className="flex items-center space-x-0 sm:space-x-2">
          <button
            type="button"
            className="flex lg:hidden size-9 cursor-pointer ml-0 sm:ml-1 items-center p-1 text-primary"
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
              className="hidden lg:flex size-9 cursor-pointer items-center text-primary 2xl:hidden"
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

          <div className="flex">
            <span className="text-sm">TTW-</span>
            <span className="hidden md:flex text-sm">Restaurant </span>
            <span className="text-sm">POS</span>
          </div>
        </div>
        <div className="flex justify-between space-x-2 items-center">
          <h1>{data?.name}</h1>
          <LocationToggle />
        </div>

        <div className="flex h-full items-center space-x-1 mr-1">
          <FullScreenButton />
          <NotificationFeed />
          <ModeButton />
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
