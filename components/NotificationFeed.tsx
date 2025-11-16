"use client";
import { setNotiRead } from "@/app/lib/backoffice/action";
import {
  fetchNotification,
  fetchTableWithIds,
} from "@/app/lib/backoffice/data";
import { timeAgo } from "@/function";
import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Bell } from "@solar-icons/react/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";

export default function NotificationFeed() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;

  const { data: notification } = useSWR(
    [isUpdateLocation],
    () => fetchNotification().then((res) => res),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const tableIds = notification?.map((item) => item.tableId) as number[];
  const { data: tables } = useSWR([notification], () =>
    fetchTableWithIds(tableIds).then((res) => res)
  );
  const unreadCount = notification?.filter((item) => !item.isRead).length || 0;

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (unreadCount > 0) {
        audioRef.current?.play(); // Play alert sound
      }
    }, 10000);
    return () => clearInterval(intervalId);
  }, [unreadCount]);
  return (
    <>
      <audio ref={audioRef} src="/bell_alert.mp3" preload="auto" />
      <Dropdown placement="bottom-end">
        <Badge
          content={unreadCount}
          isInvisible={unreadCount === 0}
          color="primary"
          shape="circle"
          showOutline={false}
        >
          <DropdownTrigger>
            <Button isIconOnly variant="light">
              <Bell className="size-7 md:size-8 cursor-pointer text-primary p-1" />
            </Button>
          </DropdownTrigger>
        </Badge>

        <DropdownMenu
          variant="faded"
          aria-label="Dropdown menu with notification"
          className="max-h-72 overflow-x-auto scrollbar-hide"
        >
          {notification && notification?.length > 0 ? (
            notification.map((item) => {
              const createdAt = new Date(item.createdAt);
              const validTable = tables?.find(
                (table) => item.tableId === table.id
              );
              return (
                <DropdownItem
                  key={item.id}
                  onPress={async () => {
                    await setNotiRead(item.id);
                    mutate("notification");
                    router.push(`/backoffice/order/${item.tableId}`);
                  }}
                  className={item.isRead ? "opacity-50" : ""}
                  textValue={item.message}
                >
                  <div className="max-w-60 w-52">
                    <div className="flex justify-between items-center">
                      <span className="text-wrap">{item.message}</span>
                      <span className="text-xs">{validTable?.name}</span>
                    </div>
                    <div>
                      <span className="text-xs">{timeAgo(createdAt)}</span>
                    </div>
                  </div>
                </DropdownItem>
              );
            })
          ) : (
            <DropdownItem key="none">There is no data</DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
