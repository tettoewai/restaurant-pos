"use client";
import { Card, Divider, ScrollShadow } from "@nextui-org/react";
import { useEffect, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export default function PromotionCard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cards = [1, 2, 3, 4, 5];

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
        {cards.map((item, index) => (
          <Card
            key={index}
            shadow="none"
            className="min-w-full h-48 sm:min-w-64 md:h-56 bg-background snap-center flex items-center justify-center"
          >
            <span className="text-primary text-6xl">{item}</span>
          </Card>
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
