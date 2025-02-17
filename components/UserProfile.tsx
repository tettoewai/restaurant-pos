"use client";
import { fetchUser } from "@/app/lib/backoffice/data";
import { Avatar } from "@heroui/react";
import useSWR from "swr";

export default function UserProfile() {
  const userFetcher = () => fetchUser().then((res) => res);
  const { data, error } = useSWR("user", userFetcher);
  return (
    <div className="h-full hidden lg:flex items-center justify-center">
      {data ? (
        <>
          <div className="m-1 h-full flex items-center justify-center">
            <Avatar src={data.image || ""} />
          </div>
          <div className="flex flex-col h-full justify-center">
            <p className="text-sm">{data.name}</p>
            <p className="text-sm">{data.email}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
