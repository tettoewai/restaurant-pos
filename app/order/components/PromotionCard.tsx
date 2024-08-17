"use client";
import { useEffect, useRef } from "react";
import { Card, ScrollShadow } from "@nextui-org/react";

export default function PromotionCard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cards = [1, 2, 3, 4, 5, 6]; // Example data for cards

  useEffect(() => {
    const scroll = () => {
      if (scrollRef.current) {
        if (
          scrollRef.current.scrollLeft + scrollRef.current.clientWidth >=
          scrollRef.current.scrollWidth / 2
        ) {
          // Reset scroll position to the beginning for infinite loop effect
          scrollRef.current.scrollTo({ left: 0, behavior: "auto" });
        } else {
          scrollRef.current.scrollBy({ left: 100, behavior: "smooth" });
        }
      }
    };

    const interval = setInterval(scroll, 5000); // Adjust the interval duration for speed

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center flex-col">
      <span className="mb-2 text-primary">Promotions (Coming soon)</span>
      <ScrollShadow
        hideScrollBar
        size={0}
        orientation="horizontal"
        className="w-full flex space-x-1 p-1 justify-start snap-mandatory snap-x scroll-smooth"
        ref={scrollRef}
      >
        {/* Render original set of cards */}
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
    </div>
  );
}
