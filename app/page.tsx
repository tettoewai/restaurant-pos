"use client";

import {
  ChecklistMinimalistic,
  CodeScan,
  Devices,
  DocumentAdd,
  HandHeart,
  MapPointFavourite,
  Notebook2,
  PeopleNearby,
  Garage,
  UsersGroupTwoRounded,
  GraphUp,
  BoxMinimalistic,
  Cart,
  SquareTransferHorizontal,
  SettingsMinimalistic,
  DangerTriangle,
} from "@solar-icons/react/ssr";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
  hover: {
    y: -5,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Force dark mode on this page
    document.documentElement.classList.add("dark");

    // Enable scrolling for this page
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";

    // Check if it's a bot/crawler (for SEO/preview purposes)
    const isBot =
      /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(
        navigator.userAgent
      );

    // Only enable overlay for real users, not bots/crawlers
    if (isBot) {
      return;
    }

    // Track mouse position for spotlight effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Track mouse enter/leave for cursor visibility
    const handleMouseEnter = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
      setIsHovering(true);
    };
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      // Restore original overflow settings when component unmounts
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasUserInteracted]);

  const functionItem = [
    {
      icon: Devices,
      title: "Responsive in multiple devices",
      description: "Works seamlessly across all devices",
    },
    {
      icon: Notebook2,
      title: "Easily manage your menus",
      description: "Simple menu management with Restaurant POS",
    },
    {
      icon: CodeScan,
      title: "Scan and order",
      description: "Quick and easy! Your customers will love it!",
    },
    {
      icon: MapPointFavourite,
      title: "Multiple locations",
      description: "Support for multiple restaurant locations",
    },
    {
      icon: ChecklistMinimalistic,
      title: "Complete solution",
      description: "Backoffice, warehouse management and order apps included",
    },
    {
      icon: HandHeart,
      title: "Dedicated support",
      description: "We are always here to help you",
    },
    {
      icon: PeopleNearby,
      title: "Location-based ordering",
      description: "Orders only when physically in restaurant",
    },
    {
      icon: DocumentAdd,
      title: "Digital receipts",
      description: "Digital receipt and rating feedback",
    },
    {
      icon: Garage,
      title: "Warehouse management",
      description: "Manage multiple warehouses for efficient inventory control",
    },
    {
      icon: BoxMinimalistic,
      title: "Inventory tracking",
      description: "Real-time stock levels and warehouse item management",
    },
    {
      icon: Cart,
      title: "Purchase orders",
      description: "Create and manage purchase orders with suppliers",
    },
    {
      icon: SquareTransferHorizontal,
      title: "Stock movements",
      description: "Track all inventory movements and transfers",
    },
    {
      icon: UsersGroupTwoRounded,
      title: "Supplier management",
      description: "Manage suppliers and streamline procurement",
    },
    {
      icon: DangerTriangle,
      title: "Stock threshold alerts",
      description: "Get notified when inventory levels are low",
    },
    {
      icon: SettingsMinimalistic,
      title: "Menu ingredient tracking",
      description: "Link menu items to warehouse ingredients automatically",
    },
    {
      icon: GraphUp,
      title: "Analytics & Reports",
      description:
        "Comprehensive sales analytics and detailed business reports",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-900 scrollbar-hide relative overflow-hidden dark">
      {/* Dark overlay with soft spotlight cutout - Only shown after user interaction */}
      {hasUserInteracted && (
        <div
          className="fixed inset-0 pointer-events-none z-20 print:hidden"
          style={{
            background: `radial-gradient(circle 500px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, transparent 25%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.45) 85%, rgba(0,0,0,0.55) 100%)`,
            opacity: isHovering ? 1 : 0.8,
            transition: "opacity 0.4s ease",
          }}
        />
      )}

      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none z-0" />

      <main className="relative z-10 flex flex-col items-center w-full px-4 py-12 sm:py-16 md:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`flex flex-col items-center text-center mb-12 ${bebasNeue.className}`}
        >
          <h1 className="text-primary text-5xl sm:text-6xl md:text-7xl mb-3 tracking-tight">
            T-Restaurant POS
          </h1>
          <p className="text-xl sm:text-2xl text-gray-400 font-normal">
            The Revolution of POS
          </p>
        </motion.div>

        {/* Main Description */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl text-center mb-16 px-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-4 leading-tight">
            Manage your menu catalog easily with Restaurant POS
          </h2>
          <p className="text-lg sm:text-xl text-gray-400">
            Entice your customers with our{" "}
            <span className="text-primary font-semibold">
              QR code ordering system
            </span>
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center items-center gap-4 mb-16"
        >
          <motion.div variants={itemVariants}>
            <Link
              href="backoffice/order"
              className="inline-flex items-center justify-center bg-primary hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[140px]"
            >
              Backoffice
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="warehouse"
              className="inline-flex items-center justify-center bg-gray-800 text-red-400 font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg border-2 border-red-400 transition-all duration-200 min-w-[140px]"
            >
              Warehouse
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/order?tableId=1"
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[140px]"
            >
              Order
            </Link>
          </motion.div>
        </motion.div>

        {/* Info Text */}
        <motion.p
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-sm text-gray-500 mb-20 text-center"
        >
          In usage, user must scan QR code to place order
        </motion.p>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full px-4 pb-12"
        >
          {functionItem.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="group bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md border border-gray-700 transition-all duration-200"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-200">
                    <Icon className="text-primary size-6" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
