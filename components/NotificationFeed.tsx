"use client";
import { setNotiRead } from "@/app/lib/backoffice/action";
import {
  fetchNotification,
  fetchTableWithIds,
} from "@/app/lib/backoffice/data";
import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@nextui-org/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoIosNotifications } from "react-icons/io";
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

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    return "Just now";
  };
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
              <IoIosNotifications className="size-7 md:size-8 cursor-pointer text-primary p-1" />
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
                  onClick={async () => {
                    await setNotiRead(item.id);
                    mutate("notification");
                    router.push(`/backoffice/order/${item.tableId}`);
                  }}
                  className={clsx({ "opacity-50": item.isRead })}
                  textValue={item.message}
                >
                  <div className="max-w-60 w-52">
                    <div className="flex justify-between items-center">
                      <span>{item.message}</span>
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
            <DropdownItem>There is no data</DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
