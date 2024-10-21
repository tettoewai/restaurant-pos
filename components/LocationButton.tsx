"use client";
import { Button, Spinner, Tooltip } from "@nextui-org/react";
import { Location } from "@prisma/client";
import { useEffect, useState } from "react";
import { MdLocationOn } from "react-icons/md";

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
          latitude && longitude && setLocation({ latitude, longitude });
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
            value={location?.latitude ? String(location?.latitude) : ""}
          />
          <input
            name="longitude"
            type="hidden"
            value={location?.longitude ? String(location?.longitude) : ""}
          />
        </div>
      ) : (
        <p>{error}</p>
      )}
      <Tooltip
        placement="right"
        content="Get coordinates"
        className="text-primary"
        showArrow={true}
        delay={1000}
      >
        <Button
          color="primary"
          isIconOnly
          size="sm"
          radius="full"
          onClick={getLocation}
          disabled={loading}
        >
          {loading ? (
            <Spinner color="white" size="sm" />
          ) : (
            <MdLocationOn size={18} />
          )}
        </Button>
      </Tooltip>
    </div>
  );
};

export default LocationButton;
