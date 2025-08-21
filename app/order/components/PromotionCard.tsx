"use client";
import {
  Card,
  CardFooter,
  Divider,
  Image,
  ScrollShadow,
} from "@heroui/react";
import { Promotion } from "@prisma/client";
import NextImage from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export default function PromotionCard({
  tableId,
  promotions,
}: {
  tableId: number;
  promotions: Promotion[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth + 1 >= scrollWidth) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
      }
    }, 5000); // adjust the time interval (in milliseconds)

    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, []);

  return (
    <div className="flex items-center flex-col relative">
      <span className="mb-2 text-primary text-center">
        Promotions
        <Divider className="bg-gray-400 w-56 mt-1" />
      </span>
      <ScrollShadow
        hideScrollBar
        isEnabled={false}
        orientation="horizontal"
        className="w-full flex space-x-1 p-1 justify-start snap-mandatory snap-x scroll-smooth"
        ref={scrollRef}
      >
        {promotions && promotions.length
          ? promotions.map((item, index) => (
              <Link
                href={`/order/promotion/${item.id}?tableId=${tableId}`}
                key={index}
                className="min-w-full max-w-sm h-60 sm:min-w-64 md:h-56 snap-center flex items-center justify-center"
              >
                <Card
                  isFooterBlurred
                  shadow="none"
                  className="relative w-full h-full bg-background"
                >
                  <div className="w-full h-full items-center flex justify-center">
                    {item.imageUrl && (
                      <Image
                        isBlurred
                        as={NextImage}
                        src={item.imageUrl}
                        alt="promotion image"
                        height={240}
                        width={240}
                        className="object-fill h-full w-auto hover:scale-110"
                      />
                    )}
                  </div>
                  <CardFooter className="flex flex-col items-start before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-md bottom-1 w-[calc(100%-8px)] shadow-small ml-1 z-10">
                    <h1 className="text-lg font-bold stroke-white stroke-2">
                      {item.name}
                    </h1>
                    <h4 className="text-default-500">{item.description}</h4>
                  </CardFooter>
                </Card>
              </Link>
            ))
          : null}
      </ScrollShadow>
      <div className="hidden md:flex">
        <button
          className="absolute left-4 top-28 bg-gray-200 bg-opacity-50 rounded-sm h-10 text-lg"
          onClick={() => {
            scrollRef.current &&
              scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
          }}
        >
          <IoIosArrowBack />
        </button>
        <button
          className="absolute right-4 top-28 bg-gray-200 bg-opacity-50 rounded-sm h-10 text-lg"
          onClick={() => {
            scrollRef.current &&
              scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
          }}
        >
          <IoIosArrowForward />
        </button>
      </div>
    </div>
  );
}
