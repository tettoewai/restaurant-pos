"use client";
import { fetchUser } from "@/app/lib/data";
import { Button } from "@nextui-org/react";
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
  const imageUrl = user?.image || "/my_logo.jpg";
  return (
    <div className="h-full overflow-hidden hidden lg:flex">
      {user ? (
        <>
          <div className="rounded-full h-full p-1">
            <Image
              src={imageUrl}
              alt="profile"
              width={50}
              height={50}
              className="h-full"
            />
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
