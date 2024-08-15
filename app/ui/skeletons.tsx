const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

import { Avatar, Card, Skeleton } from "@nextui-org/react";
import { IoMdMore } from "react-icons/io";
import { MdAttachMoney } from "react-icons/md";

export function MenuLoading() {
  return (
    <Card
      className="bg-background w-40 h-48 m-1 md:w-48 md:h-56 md:m-2 rounded-lg shadow-sm flex flex-col items-center relative"
      radius="lg"
    >
      <Skeleton className="h-3/5 w-full">
        <div className="flex bg-gray-400 justify-center items-center h-full w-full"></div>
      </Skeleton>
      <Skeleton className="rounded-md mt-3">
        <p className="w-20 h-4 bg-gray-400"></p>
      </Skeleton>
      <div className="flex items-center mt-2">
        <Skeleton className="rounded-md">
          <p className="bg-gray-400 w-20 h-4"></p>
        </Skeleton>
      </div>
    </Card>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="h-full hidden lg:flex items-center justify-center">
      <div className="m-1 h-full flex items-center justify-center">
        <Skeleton className="w-10 h-10 rounded-full"></Skeleton>
      </div>
      <div className="flex flex-col h-full justify-center space-y-1">
        <Skeleton className="w-32 h-5 rounded-md"></Skeleton>
        <Skeleton className="w-40 h-5 rounded-md"></Skeleton>
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <Card className="bg-background w-60 h-48 p-1 mr-2 mb-2 md:w-48 flex flex-col items-center relative overflow-hidden justify-center">
      <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
        <Skeleton className="bg-background rounded-md w-6 h-full"></Skeleton>
      </div>
      <Skeleton className="w-7 h-7 mb-2 rounded-md"></Skeleton>
      <Skeleton className="w-14 h-5 mb-4 rounded-md"></Skeleton>
      <Skeleton className="w-20 h-5 rounded-md"></Skeleton>
    </Card>
  );
}
