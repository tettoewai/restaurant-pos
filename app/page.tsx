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
  Global,
  Plain2,
} from "@solar-icons/react/ssr";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Globe, Send, Facebook, Linkedin } from "lucide-react";

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

type FeatureItem = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type FeatureCardProps = {
  item: FeatureItem;
  index: number;
  mousePosition: { x: number; y: number };
};

type CtaButtonProps = {
  href: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
  mousePosition: { x: number; y: number };
  hoverBorderColor?: string;
};

function CtaButton({
  href,
  ariaLabel,
  className,
  children,
  mousePosition,
  hoverBorderColor = "primary",
}: CtaButtonProps) {
  const blobSize = 220;
  const [blobPosition, setBlobPosition] = useState({
    x: -blobSize,
    y: -blobSize,
  });
  const buttonRef = useRef<HTMLAnchorElement | null>(null);

  // Use global mouse position so the border light can pass between buttons
  useEffect(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const localX = mousePosition.x - rect.left;
    const localY = mousePosition.y - rect.top;

    const x = localX - blobSize / 2;
    const y = localY - blobSize / 2;

    setBlobPosition({ x, y });
  }, [mousePosition.x, mousePosition.y, blobSize]);

  const maskCenterX = blobPosition.x + blobSize / 2;
  const maskCenterY = blobPosition.y + blobSize / 2;
  const radius = 150;
  const maskGradient = `radial-gradient(circle ${radius}px at ${maskCenterX}px ${maskCenterY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 78%)`;

  const isActive =
    maskCenterX > -radius &&
    maskCenterX <
      (buttonRef.current?.getBoundingClientRect().width ?? 0) + radius &&
    maskCenterY > -radius &&
    maskCenterY <
      (buttonRef.current?.getBoundingClientRect().height ?? 0) + radius;

  // Map color names to Tailwind classes
  const borderColorClass =
    hoverBorderColor === "blue"
      ? "border-blue-500/60"
      : hoverBorderColor === "green"
      ? "border-emerald-500/60"
      : hoverBorderColor === "purple"
      ? "border-purple-500/60"
      : hoverBorderColor === "orange"
      ? "border-orange-500/60"
      : "border-primary/60";

  const glowColorClass =
    hoverBorderColor === "blue"
      ? "bg-blue-500/40"
      : hoverBorderColor === "green"
      ? "bg-emerald-500/40"
      : hoverBorderColor === "purple"
      ? "bg-purple-500/40"
      : hoverBorderColor === "orange"
      ? "bg-orange-500/40"
      : "bg-primary/40";

  return (
    <Link
      ref={buttonRef}
      href={href}
      aria-label={ariaLabel}
      className="group relative flex overflow-hidden rounded-lg bg-gray-900/60 p-[2px] shadow-sm transition-all duration-200 hover:shadow-md"
    >
      {/* Base neutral border */}
      <div className="pointer-events-none absolute inset-0 rounded-lg border border-gray-800/40" />

      {/* Highlighted border that follows cursor */}
      <div
        className={`hidden md:flex pointer-events-none absolute inset-0 rounded-lg border ${borderColorClass} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
        style={{
          WebkitMaskImage: maskGradient,
          maskImage: maskGradient,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* Glow blob that follows cursor and lights up only part of the border */}
      <div className="pointer-events-none absolute inset-0 hidden md:flex">
        <div
          className={`absolute rounded-full ${glowColorClass} blur-[50px] opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
          style={{
            width: blobSize,
            height: blobSize,
            transform: `translate3d(${blobPosition.x}px, ${blobPosition.y}px, 0)`,
            opacity: isActive ? 1 : 0,
          }}
        />
      </div>

      {/* Actual button content */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-[0.6rem] bg-gray-800/80 backdrop-blur-sm transition-colors duration-200 group-hover:bg-gray-800 ${className}`}
      >
        {children}
      </div>
    </Link>
  );
}

function FeatureCard({ item, index, mousePosition }: FeatureCardProps) {
  const blobSize = 220;
  const [blobPosition, setBlobPosition] = useState({
    x: -blobSize,
    y: -blobSize,
  });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const Icon = item.icon;

  // Update glow position based on global cursor, so any card near the light gets highlighted
  useEffect(() => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    // Cursor position relative to card
    const localX = mousePosition.x - rect.left;
    const localY = mousePosition.y - rect.top;

    // Distance from card bounds (0 when inside, positive when outside)
    // Center the blob on the cursor relative to card
    const x = localX - blobSize / 2;
    const y = localY - blobSize / 2;

    setBlobPosition({ x, y });
  }, [mousePosition.x, mousePosition.y, blobSize]);

  const maskCenterX = blobPosition.x + blobSize / 2;
  const maskCenterY = blobPosition.y + blobSize / 2;
  const radius = 150;
  const maskGradient = `radial-gradient(circle ${radius}px at ${maskCenterX}px ${maskCenterY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 78%)`;

  // Consider the glow active when cursor is within an expanded box around the card
  const isActive =
    maskCenterX > -radius &&
    maskCenterX <
      (cardRef.current?.getBoundingClientRect().width ?? 0) + radius &&
    maskCenterY > -radius &&
    maskCenterY <
      (cardRef.current?.getBoundingClientRect().height ?? 0) + radius;

  return (
    <motion.div
      ref={cardRef}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-gray-900/60 p-[2px] shadow-sm transition-all duration-200 hover:shadow-md"
    >
      {/* Base neutral border */}
      <div className="pointer-events-none absolute inset-0 rounded-xl border border-gray-800/40" />

      {/* Highlighted border that follows cursor */}
      <div
        className="hidden md:flex pointer-events-none absolute inset-0 rounded-xl border border-primary/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          WebkitMaskImage: maskGradient,
          maskImage: maskGradient,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* Glow blob that follows cursor and lights up only part of the border */}
      <div className="pointer-events-none absolute inset-0 hidden md:flex">
        <div
          className="absolute rounded-full bg-primary/40 blur-[50px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            width: blobSize,
            height: blobSize,
            transform: `translate3d(${blobPosition.x}px, ${blobPosition.y}px, 0)`,
            opacity: isActive ? 1 : 0,
          }}
        />
      </div>

      {/* Actual card content */}
      <div className="relative z-10 flex h-full flex-col items-center rounded-[0.6rem] bg-gray-800/80 p-6 text-center backdrop-blur-sm transition-colors duration-200 group-hover:bg-gray-800">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-950 group-hover:bg-gray-900 transition-colors duration-200">
          <Icon className="size-6 text-white" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-gray-100">
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed text-gray-400">
          {item.description}
        </p>
        <div className="mt-auto h-0" />
      </div>
    </motion.div>
  );
}

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

  const functionItem: FeatureItem[] = [
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "T-Restaurant POS",
    description:
      "Restaurant POS with QR ordering, warehouse management, and analytics.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/PreOrder",
      price: "0",
      priceCurrency: "USD",
    },
    brand: {
      "@type": "Brand",
      name: "T-Restaurant",
    },
    url: "https://restaurant-pos.local/",
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 scrollbar-hide relative overflow-hidden dark">
      {/* Dark overlay with soft spotlight cutout - Only shown after user interaction */}
      {hasUserInteracted && (
        <div
          className="fixed inset-0 pointer-events-none z-20 print:hidden hidden md:flex"
          style={{
            background: `radial-gradient(circle 500px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, transparent 25%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.45) 85%, rgba(0,0,0,0.55) 100%)`,
            opacity: isHovering ? 1 : 0.8,
            transition: "opacity 0.4s ease",
          }}
        />
      )}

      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none z-0" />

      <Script
        id="structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="relative z-10 flex flex-col items-center w-full px-4 py-12 sm:py-16 md:py-20">
        <header
          className="w-full flex flex-col items-center text-center mb-12"
          aria-labelledby="hero-heading"
        >
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`flex flex-col items-center ${bebasNeue.className}`}
          >
            <h1
              id="hero-heading"
              className="text-primary text-5xl sm:text-6xl md:text-7xl mb-3 tracking-tight"
            >
              T-Restaurant POS
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 font-normal">
              The Revolution of POS
            </p>
          </motion.div>
        </header>

        <section
          id="overview"
          aria-labelledby="overview-heading"
          className="w-full"
        >
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl text-center mb-10 px-4 mx-auto"
          >
            <h2
              id="overview-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-4 leading-tight"
            >
              Manage your menu catalog easily with Restaurant POS
            </h2>
            <p className="text-lg sm:text-xl text-gray-400">
              Entice your customers with our{" "}
              <span className="text-primary font-semibold">
                QR code ordering system
              </span>{" "}
              and manage operations from a single dashboard.
            </p>
          </motion.div>
          <motion.p
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-sm text-gray-500 mb-16 text-center"
          >
            Guests must scan an authenticated QR code on-site to place orders,
            keeping every transaction trustworthy.
          </motion.p>
        </section>
        {/* CTA section */}
        <section
          id="cta"
          aria-label="Primary product actions"
          className="w-full flex justify-center"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center items-center gap-4 mb-16"
          >
            <motion.div variants={itemVariants}>
              <CtaButton
                href="backoffice/order"
                aria-label="Explore the full backoffice ordering suite"
                className="inline-flex items-center justify-center font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[200px]"
                mousePosition={mousePosition}
                hoverBorderColor="blue"
              >
                Explore Backoffice Suite
              </CtaButton>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CtaButton
                href="warehouse"
                aria-label="Review warehouse and inventory controls"
                className="inline-flex items-center justify-center font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[200px]"
                mousePosition={mousePosition}
                hoverBorderColor="green"
              >
                Manage Warehouse Ops
              </CtaButton>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CtaButton
                href="/order?tableId=1"
                aria-label="Launch the QR ordering demo for table one"
                className="inline-flex items-center justify-center font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[200px]"
                mousePosition={mousePosition}
                hoverBorderColor="purple"
              >
                Start QR Order Demo
              </CtaButton>
            </motion.div>
          </motion.div>
        </section>

        {/* Features section */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="w-full flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl text-center mb-10 px-4"
          >
            <h2
              id="features-heading"
              className="text-2xl sm:text-3xl font-bold text-gray-100 mb-3"
            >
              Why restaurants choose T-Restaurant POS
            </h2>
            <p className="text-gray-400">
              Every module is built for busy teams—covering ordering, inventory,
              and insights without switching tools.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid w-full max-w-7xl grid-cols-1 gap-6 px-4 pb-12 sm:grid-cols-2 lg:grid-cols-4"
          >
            {functionItem.map((item, index) => (
              <FeatureCard
                key={item.title}
                item={item}
                index={index}
                mousePosition={mousePosition}
              />
            ))}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-gray-800/40 bg-gray-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Social Links */}
            <div className="flex items-center justify-center gap-4">
              <motion.a
                href="https://tettoewai.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-colors duration-200 hover:bg-primary/20 hover:text-primary"
              >
                <Global className="size-5" />
              </motion.a>
              <motion.a
                href="https://t.me/tettoewai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-colors duration-200 hover:bg-primary/20 hover:text-primary"
              >
                <Plain2 className="size-5" />
              </motion.a>
              <motion.a
                href="https://facebook.com/tettoewai0"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-colors duration-200 hover:bg-primary/20 hover:text-primary"
              >
                <Facebook className="size-5" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/tettoewai/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 transition-colors duration-200 hover:bg-primary/20 hover:text-primary"
              >
                <Linkedin className="size-5" />
              </motion.a>
            </div>

            {/* Copyright */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} T-Lab. All rights reserved.
              </p>
              <p className="text-xs text-gray-500">
                T-Restaurant POS - The Revolution of POS
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
