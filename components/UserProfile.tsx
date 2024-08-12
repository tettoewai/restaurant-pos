"use client";
import { fetchUser } from "@/app/lib/data";
import { Avatar, Button } from "@nextui-org/react";
import { User } from "@prisma/client";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const session = useSession();
  const sessionEmail = session.data?.user?.email;
  const getUser = async (email: string) => {
    const user = await fetchUser();
    user && setUser(user);
  };
  useEffect(() => {
    if (sessionEmail) {
      getUser(sessionEmail);
    }
  }, [sessionEmail]);
  return (
    <div className="h-full hidden lg:flex items-center justify-center">
      {user ? (
        <>
          <div className="m-1 h-full flex items-center justify-center">
            <Avatar src={user.image || ""} />
          </div>
          <div className="flex flex-col h-full justify-center">
            <p className="text-sm">{user.name}</p>
            <p className="text-sm">{user.email}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
