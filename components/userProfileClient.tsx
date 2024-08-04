// UserProfileClient.tsx

import React from "react";
import { User } from "@prisma/client";
import Image from "next/image";

interface Props {
  user: User | null;
}

const UserProfileClient: React.FC<Props> = ({ user }) => {
  const imageUrl = user?.image || "/my_logo.jpg";

  return (
    <div className="h-full overflow-hidden hidden lg:flex">
      {user ? (
        <>
          <div className="rounded-full">
            <Image src={imageUrl} alt="profile" className="h-full" />
          </div>
          <div className="flex flex-col h-full justify-center">
            <p className="text-sm">{user.name}</p>
            <p className="text-sm">{user.email}</p>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default UserProfileClient;
