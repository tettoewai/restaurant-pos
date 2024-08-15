"use client";
import { fetchUser } from "@/app/lib/data";
import { UserProfileSkeleton } from "@/app/ui/skeletons";
import { Avatar } from "@nextui-org/react";
import { User } from "@prisma/client";
import { useEffect, useState } from "react";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const user = await fetchUser();
      user && setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);
  if (loading) return <UserProfileSkeleton />;
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
