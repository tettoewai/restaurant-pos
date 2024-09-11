import { fetchNotification } from "@/app/lib/backoffice/data";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoIosNotifications } from "react-icons/io";
import useSWR from "swr";

export default function NotificationFeed() {
  const { data: notification } = useSWR(
    "notification",
    () => fetchNotification().then((res) => res),
    { refreshInterval: 10000 }
  );
  const router = useRouter();

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <button>
            <IoIosNotifications className="w-8 h-8 hover:shadow-md cursor-pointer m-1 text-primary p-1" />
          </button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
          {notification && notification?.length > 0 ? (
            notification.map((item) => (
              <DropdownItem
                key={item.id}
                onClick={() => {
                  router.push(`/backoffice/order/${item.tableId}`);
                  console.log("clicked");
                }}
              >
                <div className="max-w-60">
                  <span className="truncate ...">{item.message}</span>
                </div>
              </DropdownItem>
            ))
          ) : (
            <DropdownItem>There is no data</DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
