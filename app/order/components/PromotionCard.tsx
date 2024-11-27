"use client";
import { Card, Divider, ScrollShadow } from "@nextui-org/react";
import { Promotion } from "@prisma/client";
import { useEffect, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Image } from "@nextui-org/react";
import NextImage from "next/image";
import Link from "next/link";

export default function PromotionCard({
  promotions,
  tableId,
}: {
  promotions: Promotion[];
  tableId: number;
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
        Promotions (Coming soon)
        <Divider className="bg-gray-400 w-56 mt-1" />
      </span>
      <ScrollShadow
        hideScrollBar
        isEnabled={false}
        orientation="horizontal"
        className="w-full flex space-x-1 p-1 justify-start snap-mandatory snap-x scroll-smooth"
        ref={scrollRef}
      >
        {promotions.map((item, index) => (
          <Link
            href={`/order/promotion/${item.id}?tableId=${tableId}`}
            key={index}
            className="min-w-full max-w-sm h-60 sm:min-w-64 md:h-56 snap-center flex items-center justify-center"
          >
            <Card shadow="none" className="relative w-full bg-background">
              <div className="w-full h-full items-center flex justify-center">
                <Image
                  isBlurred
                  as={NextImage}
                  src=""
                  alt="promotion image"
                  height={240}
                  width={240}
                  className="object-fill h-full w-auto hover:scale-110"
                />
              </div>
              <div className="absolute bottom-0 left-0 pl-3 pb-2 bg-gray-500 bg-opacity-20 w-full z-10">
                <h1 className="text-lg font-bold">{item.name}</h1>
                <h4 className="text-default-500">{item.description}</h4>
              </div>
            </Card>
          </Link>
        ))}
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
