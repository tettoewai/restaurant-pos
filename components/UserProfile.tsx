"use client";
import { fetchUser } from "@/app/lib/backoffice/data";
import { Avatar, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function UserProfile() {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues by only fetching after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading } = useSWR(
    mounted ? "user" : null,
    () => fetchUser().then((res) => res),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Show loading state during initial load
  if (!mounted || isLoading) {
    return (
      <div className="h-full hidden lg:flex items-center justify-center">
        <div className="m-1 h-full flex items-center justify-center">
          <Spinner size="sm" variant="wave" />
        </div>
      </div>
    );
  }

  // Show error state (optional - could show a default avatar)
  if (error || !data) {
    return (
      <div className="h-full hidden lg:flex items-center justify-center">
        <div className="m-1 h-full flex items-center justify-center">
          <Avatar name="User" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full hidden lg:flex items-center justify-center">
      <div className="m-1 h-full flex items-center justify-center">
        <Avatar src={data.image || undefined} name={data.name || undefined} />
      </div>
      {/* <div className="flex flex-col h-full justify-center">
        <p className="text-sm">{data.name}</p>
        <p className="text-sm">{data.email}</p>
      </div> */}
    </div>
  );
}
