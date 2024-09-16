"use client";
import OrderContextProvider from "@/context/OrderContext";
import { useLocation } from "@/Generial";
import React from "react";
import useSWR from "swr";
import { fetchLocationWithId, fetchTableWithId } from "../lib/backoffice/data";
import LoadingSpiner from "./components/LoadingSpiner";
import TopBarOrder from "./components/TopBarOrder";
import { useSearchParams } from "next/navigation";

function Layout({ children }: { children: React.ReactNode }) {
  const router = useSearchParams();
  const tableId = Number(router.get("tableId"));

  function getDistanceFromLatLonInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
    const dLon = (lon2 - lon1) * (Math.PI / 180); // Convert degrees to radians
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  }

  const {
    location,
    error: locationError,
    loading: locationLoading,
  } = useLocation();

  const {
    data: table,
    error: tableError,
    isLoading: tableLoading,
  } = useSWR("table", () => fetchTableWithId(tableId));

  const { data: restaurantLocation, error: restaurantLocationErr } = useSWR(
    table ? `location-${table.locationId}` : null,
    () => table && fetchLocationWithId(table.locationId)
  );

  // Show spinner while loading location data
  if (locationLoading) return <LoadingSpiner text={"Getting your location"} />;
  if (locationError)
    return <span>Error fetching location: {locationError}</span>;

  // Check if both customer and restaurant locations are available
  if (
    restaurantLocation?.latitude &&
    restaurantLocation.longitude &&
    location
  ) {
    const distance = getDistanceFromLatLonInMeters(
      location.latitude,
      location.longitude,
      Number(restaurantLocation.latitude),
      Number(restaurantLocation.longitude)
    );
    const isInRestaurant = distance < 50;
    if (!isInRestaurant) {
      return (
        <div className="flex flex-col justify-center items-center h-full mt-44">
          <div className="max-w-xs overflow-hidden rounded-md">
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d389.1707419218062!2d${restaurantLocation.longitude}!3d${restaurantLocation.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjHCsDUyJzQ1LjYiTiA5NsKwMDcnMTEuOCJF!5e0!3m2!1sen!2smm!4v1726417088959!5m2!1sen!2smm`}
              width="320"
              height="320"
              loading="lazy"
            ></iframe>
          </div>
          <span className="text-lg text-center mt-2 text-primary">
            You need to be in the restaurant and scan qr code to place an order.
          </span>
        </div>
      );
    }
  }
  return (
    <OrderContextProvider>
      <div className="bg-gray-200 dark:bg-gray-950 min-h-dvh select-none">
        <TopBarOrder />
        <div className="pt-16">{children}</div>
      </div>
    </OrderContextProvider>
  );
}

export default Layout;
