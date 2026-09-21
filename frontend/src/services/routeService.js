import {
  shiftFollowingActivities,
  TRANSPORT_MODES,
} from "./itineraryService.js";

export const GOA_LOCATIONS = {
  Mandrem: { zone: "North-Far", lat: 15.666, lng: 73.714 },
  Morjim: { zone: "North-Far", lat: 15.625, lng: 73.737 },
  Assagao: { zone: "North-Hinterland", lat: 15.590, lng: 73.770 },
  Anjuna: { zone: "North-Coast", lat: 15.580, lng: 73.743 },
  Baga: { zone: "North-Beach", lat: 15.556, lng: 73.751 },
  Calangute: { zone: "North-Beach", lat: 15.543, lng: 73.755 },
  Candolim: { zone: "North-Coast", lat: 15.518, lng: 73.763 },
  "Reis Magos": { zone: "Mandovi-North", lat: 15.501, lng: 73.808 },
  Panjim: { zone: "Central-Panjim", lat: 15.498, lng: 73.827 },
  Fontainhas: { zone: "Central-Panjim", lat: 15.495, lng: 73.832 },
  "Old Goa": { zone: "Central-East", lat: 15.503, lng: 73.912 },
  Ponda: { zone: "Interior-Spice", lat: 15.402, lng: 74.015 },
  Palolem: { zone: "South-Coast", lat: 15.010, lng: 74.023 },
  "South Goa": { zone: "South-Coast", lat: 15.010, lng: 74.023 },
  "Bhagwan Mahavir Wildlife Sanctuary": { zone: "East-Ghats", lat: 15.340, lng: 74.240 },
};

export function getLocationCoords(locationName) {
  if (!locationName) return { zone: "Central-Panjim", lat: 15.498, lng: 73.827 };
  const cleaned = String(locationName).trim();
  if (GOA_LOCATIONS[cleaned]) return GOA_LOCATIONS[cleaned];

  for (const [key, coords] of Object.entries(GOA_LOCATIONS)) {
    if (cleaned.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleaned.toLowerCase())) {
      return coords;
    }
  }
  if (cleaned.toLowerCase().includes("north")) return GOA_LOCATIONS.Calangute;
  if (cleaned.toLowerCase().includes("south")) return GOA_LOCATIONS.Palolem;
  return GOA_LOCATIONS.Panjim;
}

/**
 * Calculates estimated travel minutes between two Goa locations.
 */
export function estimateTravelTime(locA, locB) {
  const a = getLocationCoords(locA);
  const b = getLocationCoords(locB);
  if (a.zone === b.zone) return 12;

  const dLat = (b.lat - a.lat) * 111;
  const dLng = (b.lng - a.lng) * 105;
  const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng);

  const travelMinutes = Math.round(8 + (distanceKm / 32) * 60);
  return Math.max(10, Math.min(120, travelMinutes));
}

function calculateSequenceTravel(items) {
  if (!items || items.length <= 1) return 0;
  let total = 0;
  for (let i = 1; i < items.length; i += 1) {
    total += estimateTravelTime(items[i - 1].location, items[i].location);
  }
  return total;
}

/**
 * Analyzes a day's items for unnecessary backtracking and travel inefficiency.
 */
export function analyzeDayRoute(day) {
  if (!day?.items || day.items.length <= 2) {
    return { canOptimize: false, currentTravelMinutes: 0, optimizedTravelMinutes: 0, savingsMinutes: 0 };
  }

  const currentTravelMinutes = calculateSequenceTravel(day.items);

  const items = [...day.items];
  const first = items[0];
  const remaining = items.slice(1);

  const optimizedChain = [first];
  const unvisited = [...remaining];

  while (unvisited.length > 0) {
    const currentLoc = optimizedChain[optimizedChain.length - 1].location;
    let closestIndex = 0;
    let closestTime = Infinity;

    for (let i = 0; i < unvisited.length; i += 1) {
      const time = estimateTravelTime(currentLoc, unvisited[i].location);
      if (time < closestTime) {
        closestTime = time;
        closestIndex = i;
      }
    }
    optimizedChain.push(unvisited.splice(closestIndex, 1)[0]);
  }

  const optimizedTravelMinutes = calculateSequenceTravel(optimizedChain);
  const savingsMinutes = currentTravelMinutes - optimizedTravelMinutes;

  const hasMeaningfulImprovement =
    savingsMinutes >= 15 && savingsMinutes / currentTravelMinutes >= 0.18;

  const isDifferentOrder = optimizedChain.some(
    (item, index) => item.id !== day.items[index].id
  );

  return {
    canOptimize: hasMeaningfulImprovement && isDifferentOrder,
    currentTravelMinutes,
    optimizedTravelMinutes,
    savingsMinutes: Math.max(0, savingsMinutes),
    optimizedItems: optimizedChain,
  };
}

/**
 * Optimizes a day's stops into the most efficient geographic order.
 */
export function optimizeDayRoute(day, shiftFn = shiftFollowingActivities) {
  const analysis = analyzeDayRoute(day);
  if (!analysis.canOptimize || !analysis.optimizedItems) {
    return { valid: false, error: "Your current route is already efficient." };
  }

  const startTime = day.items[0].time;
  const reordered = analysis.optimizedItems.map((item, index) => {
    const transitMin = index === 0 ? 0 : estimateTravelTime(analysis.optimizedItems[index - 1].location, item.location);
    const mode = item.transportation?.mode || "Taxi";
    return {
      ...item,
      transportation: index === 0 ? null : {
        mode,
        duration: `${transitMin} min`,
        estimatedCost: TRANSPORT_MODES[mode]?.estimatedCost ?? 200,
      },
    };
  });

  reordered[0].time = startTime;
  const tempDay = { ...day, items: reordered };

  const shiftError = shiftFn(tempDay, 0);
  if (shiftError) {
    return { valid: false, error: "Optimizing the route would push remaining activities past midnight." };
  }

  return {
    valid: true,
    items: tempDay.items,
    savingsMinutes: analysis.savingsMinutes,
  };
}
