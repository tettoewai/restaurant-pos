/**
 * Server-side location validation
 * Validates that a user is within the allowed radius of a restaurant location
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface RestaurantLocation {
  latitude: string | number;
  longitude: string | number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if user location is within allowed radius of restaurant
 * @param userLocation User's current location
 * @param restaurantLocation Restaurant's location
 * @param maxRadiusMeters Maximum allowed radius in meters (default: 200m)
 * @returns true if user is within radius, false otherwise
 */
export function validateLocation(
  userLocation: Location,
  restaurantLocation: RestaurantLocation,
  maxRadiusMeters: number = 200
): { isValid: boolean; distance: number } {
  const userLat = userLocation.latitude;
  const userLon = userLocation.longitude;
  const restaurantLat = Number(restaurantLocation.latitude);
  const restaurantLon = Number(restaurantLocation.longitude);

  // Validate coordinates
  if (
    !isFinite(userLat) ||
    !isFinite(userLon) ||
    !isFinite(restaurantLat) ||
    !isFinite(restaurantLon)
  ) {
    return { isValid: false, distance: Infinity };
  }

  if (
    userLat < -90 ||
    userLat > 90 ||
    userLon < -180 ||
    userLon > 180 ||
    restaurantLat < -90 ||
    restaurantLat > 90 ||
    restaurantLon < -180 ||
    restaurantLon > 180
  ) {
    return { isValid: false, distance: Infinity };
  }

  const distance = calculateDistance(
    userLat,
    userLon,
    restaurantLat,
    restaurantLon
  );

  return {
    isValid: distance <= maxRadiusMeters,
    distance,
  };
}

