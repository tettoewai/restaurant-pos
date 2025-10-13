const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent";

import { Card, Skeleton } from "@heroui/react";

export function MenuLoading() {
  return (
    <Card
      className="bg-background w-[170px] h-56 mr-2 mb-2 md:w-48 md:h-60 flex flex-col items-center relative"
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
    <Card className="bg-background  w-44 h-48 p-1 mr-2 mb-2 md:w-52 flex flex-col items-center relative overflow-hidden justify-center">
      <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
        <Skeleton className="bg-background rounded-md w-6 h-full"></Skeleton>
      </div>
      <Skeleton className="w-7 h-7 mb-2 rounded-md"></Skeleton>
      <Skeleton className="w-14 h-5 mb-4 rounded-md"></Skeleton>
      <Skeleton className="w-20 h-5 rounded-md"></Skeleton>
    </Card>
  );
}

export function DashboardCardSkeleton() {
  return (
    <Card className="bg-background w-full sm:w-44 h-36 flex flex-row sm:flex-col items-center mr-1 mb-1">
      <div className=" flex justify-between items-center h-full sm:w-fit w-1/2 sm:h-2/5 pr-2  sm:bg-transparent sm:dark:bg-transparent bg-gray-200 dark:bg-gray-900 ">
        <Skeleton className="m-3 w-11 h-4 rounded-sm"></Skeleton>
        <Skeleton className="p-3 m-1 w-11 h-11 rounded-md"></Skeleton>
      </div>
      <div className="w-1/2 sm:w-full h-2/5 mt-0 sm:mt-3 flex items-center justify-center">
        <Skeleton className="w-16 h-5 sm:h-14 ml-5 rounded-md mt-0 sm:mt-2"></Skeleton>
      </div>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <Card className="h-36 w-full md:w-[98%] bg-background rounded-md p-2">
      <Skeleton className="w-full h-10 rounded-md "></Skeleton>
      <div className="space-y-1 mt-2">
        <Skeleton className="w-full h-6 rounded-md "></Skeleton>
        <Skeleton className="w-full h-6 rounded-md "></Skeleton>
        <Skeleton className="w-full h-6 rounded-md "></Skeleton>
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex space-x-3 w-full items-center justify-center p-2">
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
      <Skeleton className="rounded-md w-10 h-72"></Skeleton>
    </div>
  );
}

export function AddonCatSkeleton() {
  return (
    <Card className="p-3 border bg-background">
      <div className="flex justify-between mb-2">
        <Skeleton className="w-32 h-6 rounded-md"></Skeleton>
        <Skeleton className="w-36 h-6 rounded-full"></Skeleton>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="border rounded-md w-full flex justify-between items-center p-2 cursor-pointer">
          <Skeleton className="w-40 h-6 rounded-md"></Skeleton>
          <Skeleton className="w-32 h-6 rounded-md"></Skeleton>
        </div>
        <div className="border rounded-md w-full flex justify-between items-center p-2 cursor-pointer">
          <Skeleton className="w-40 h-6 rounded-md"></Skeleton>
          <Skeleton className="w-32 h-6 rounded-md"></Skeleton>
        </div>
        <div className="border rounded-md w-full flex justify-between items-center p-2 cursor-pointer">
          <Skeleton className="w-40 h-6 rounded-md"></Skeleton>
          <Skeleton className="w-32 h-6 rounded-md"></Skeleton>
        </div>
      </div>
    </Card>
  );
}
