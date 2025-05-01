import type { Metadata } from "next";
import { baseMetadata } from "@/app/lib/baseMetadata";
import OrderClient from "./OrderClient";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Order | ${baseMetadata.title}`,
};

export default function OrderPage() {
  return <OrderClient />;
}
