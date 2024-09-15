"use client";
import { Button, Spinner } from "@nextui-org/react";
import { Location } from "@prisma/client";
import { useEffect, useState } from "react";

interface Props {
  prevData?: Location | null;
}

const LocationButton = ({ prevData }: Props) => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (prevData) {
      setLocation({
        latitude: Number(prevData?.latitude),
        longitude: Number(prevData?.longitude),
      });
    }
  }, [prevData]);
  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };
  console.log(location);
  return (
    <div className="flex justify-between items-center">
      {!error ? (
        <div>
          {!location?.latitude || !location?.longitude ? (
            <span className="text-warning text-xs">
              If you do not set coordinates, customers outside the restaurant
              will still be able to place orders.
            </span>
          ) : (
            <>
              <p>Latitude: {location?.latitude}</p>
              <p>Longitude: {location?.longitude}</p>
            </>
          )}
          <input
            name="latitude"
            type="hidden"
            value={String(location?.latitude)}
          />
          <input
            name="longitude"
            type="hidden"
            value={String(location?.longitude)}
          />
        </div>
      ) : (
        <p>{error}</p>
      )}
      <Button
        color="primary"
        size="sm"
        className="m-0 p-4"
        onClick={getLocation}
        disabled={loading}
      >
        {loading ? <Spinner color="white" size="sm" /> : "Get coordinates"}
      </Button>
    </div>
  );
};

export default LocationButton;
