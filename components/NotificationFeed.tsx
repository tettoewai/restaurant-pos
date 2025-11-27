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
import { useEffect, useRef, useState } from "react";
import useSWR, { mutate } from "swr";

export default function NotificationFeed() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use state to prevent hydration mismatch with localStorage
  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [lastUnreadCount, setLastUnreadCount] = useState(0);

  // Initialize localStorage value after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    setIsUpdateLocation(localStorage.getItem("isUpdateLocation"));
  }, []);

  // Listen for storage changes (when location changes)
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isUpdateLocation") {
        setIsUpdateLocation(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  const { data: notification, isLoading } = useSWR(
    mounted ? ["notification", isUpdateLocation] : null,
    () => fetchNotification().then((res) => res),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Filter out null tableIds and get unique table IDs
  const tableIds =
    notification && notification.length > 0
      ? (notification
          ?.map((item) => item.tableId)
          .filter((id): id is number => id !== null) as number[])
      : [];

  const { data: tables } = useSWR(
    tableIds.length > 0 ? ["tables", tableIds] : null,
    () =>
      tableIds.length > 0 ? fetchTableWithIds(tableIds).then((res) => res) : []
  );

  const unreadCount =
    notification && notification.length > 0
      ? notification.filter((item) => !item.isRead).length
      : 0;

  // Play sound only when new unread notifications appear (not on every interval)
  useEffect(() => {
    if (!mounted) return;

    // Only play sound if unread count increased
    if (unreadCount > lastUnreadCount && unreadCount > 0) {
      try {
        audioRef.current?.play().catch((error) => {
          // Ignore autoplay errors (user might have blocked autoplay)
          console.debug("Audio playback prevented:", error);
        });
      } catch (error) {
        console.debug("Audio playback error:", error);
      }
    }
    setLastUnreadCount(unreadCount);
  }, [unreadCount, lastUnreadCount, mounted]);
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
              const validTable = item.tableId
                ? tables?.find((table) => item.tableId === table.id)
                : null;
              const isWMSNotification = item.type === "WMS_CHECK";

              return (
                <DropdownItem
                  key={item.id}
                  onPress={async () => {
                    try {
                      await setNotiRead(item.id);
                      // Invalidate the correct SWR cache key
                      mutate(["notification", isUpdateLocation]);

                      if (isWMSNotification && item.wmsCheckResultId) {
                        router.push(
                          `/warehouse/wms-check/${item.wmsCheckResultId}`
                        );
                      } else if (item.tableId) {
                        router.push(`/backoffice/order/${item.tableId}`);
                      }
                    } catch (error) {
                      console.error(
                        "Error marking notification as read:",
                        error
                      );
                    }
                  }}
                  className={item.isRead ? "opacity-50" : ""}
                  textValue={item.message}
                >
                  <div className="max-w-60 w-52">
                    <div className="flex justify-between items-center">
                      <span className="text-wrap">{item.message}</span>
                      {validTable && (
                        <span className="text-xs">{validTable.name}</span>
                      )}
                      {isWMSNotification && (
                        <span className="text-xs text-orange-600 font-semibold">
                          WMS
                        </span>
                      )}
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
