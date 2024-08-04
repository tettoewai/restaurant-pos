const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

import { Card, Skeleton } from "@nextui-org/react";
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
