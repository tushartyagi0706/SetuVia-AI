import { formatRupees } from "../utils/format.js";

function durationToMinutes(value) {
  const match = String(value).match(/([\d.]+)\s*hour/);
  if (match) return Math.round(Number(match[1]) * 60);
  const minuteMatch = String(value).match(/(\d+)\s*minute/);
  return minuteMatch ? Number(minuteMatch[1]) : 60;
}

function transportDurationToMinutes(value) {
  const match = String(value || "").match(/(\d+)\s*min/);
  return match ? Number(match[1]) : 0;
}

function timeToMinutes(value) {
  const match = String(value).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9 * 60;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * FEATURE 2: Trip Health / Day Feasibility
 */
export function calculateDayHealth(day) {
  if (!day?.items || day.items.length === 0) {
    return {
      status: "comfortable",
      label: "Comfortable",
      icon: "check",
      badgeClass: "bg-pine/10 text-pine border-pine/30",
      activityMinutes: 0,
      travelMinutes: 0,
      activityText: "0h activities",
      travelText: "0m travel",
      summaryText: "No activities scheduled",
      explanation: `Day ${day?.day || 1} has no activities scheduled.`,
      suggestion: "Add stops to begin shaping this day.",
      isPacked: false,
    };
  }

  const activityCount = day.items.length;
  let activityMinutes = 0;
  let travelMinutes = 0;

  day.items.forEach((item) => {
    activityMinutes += durationToMinutes(item.duration);
    travelMinutes += transportDurationToMinutes(item.transportation?.duration);
  });

  const firstItemStart = timeToMinutes(day.items[0].time);
  const lastItem = day.items[day.items.length - 1];
  const lastItemEnd = timeToMinutes(lastItem.time) + durationToMinutes(lastItem.duration);
  const daySpan = lastItemEnd - firstItemStart;
  const freeMinutes = Math.max(0, daySpan - (activityMinutes + travelMinutes));

  const activityText = formatMinutes(activityMinutes) + " activities";
  const travelText = formatMinutes(travelMinutes) + " travel";
  const summaryText = `${activityText} · ${travelText}`;

  // Centralized feasibility thresholds
  const isTooPacked =
    activityMinutes > 510 || // > 8.5 hours
    travelMinutes > 110 ||   // > 1h 50m travel
    activityCount >= 6 ||
    lastItemEnd > 22.5 * 60; // finishes after 10:30 PM

  const isModeratelyPacked =
    !isTooPacked &&
    (activityMinutes > 390 || // > 6.5 hours
      travelMinutes > 70 ||   // > 1h 10m travel
      activityCount >= 5 ||
      lastItemEnd > 21.5 * 60); // finishes after 9:30 PM

  if (isTooPacked) {
    return {
      status: "too-packed",
      label: "Too packed",
      icon: "alert",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      activityMinutes,
      travelMinutes,
      freeMinutes,
      activityCount,
      activityText,
      travelText,
      summaryText,
      explanation: `Day ${day.day} is too packed because it contains ${activityText} and ${travelText} across ${activityCount} stops.`,
      suggestion: "Consider removing one activity or making the day start earlier.",
      isPacked: true,
    };
  }

  if (isModeratelyPacked) {
    return {
      status: "moderate",
      label: "Moderately packed",
      icon: "clock",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      activityMinutes,
      travelMinutes,
      freeMinutes,
      activityCount,
      activityText,
      travelText,
      summaryText,
      explanation: `Day ${day.day} is moderately packed with ${activityText} and ${travelText}.`,
      suggestion: "A full day. Plan a relaxed lunch if you'd like more open time to explore.",
      isPacked: false,
    };
  }

  return {
    status: "comfortable",
    label: "Comfortable",
    icon: "check",
    badgeClass: "bg-pine/10 text-pine border-pine/30",
    activityMinutes,
    travelMinutes,
    freeMinutes,
    activityCount,
    activityText,
    travelText,
    summaryText,
    explanation: `Day ${day.day} is comfortable with ${activityText} and ${travelText}, leaving plenty of breathing room.`,
    suggestion: "A well-balanced day with ample time to unwind.",
    isPacked: false,
  };
}

/**
 * FEATURE 3: Budget Insights + Savings Suggestions
 */
export function calculateBudgetInsights(itinerary) {
  if (!itinerary) return null;

  const budget = Number(itinerary.budget || 0);
  const totalCost = Number(itinerary.estimated_cost || 0);
  const travelers = Math.max(1, Number(itinerary.travelers || 2));
  const diff = budget - totalCost;
  const isOverBudget = diff < 0;
  const absDiff = Math.abs(diff);

  const breakdown = itinerary.cost_breakdown || { activities: 0, food: 0, transportation: 0, total: totalCost };
  const safeTotal = totalCost > 0 ? totalCost : 1;

  const activitiesPct = Math.round((breakdown.activities / safeTotal) * 100);
  const foodPct = Math.round((breakdown.food / safeTotal) * 100);
  const transportPct = Math.max(0, 100 - activitiesPct - foodPct);

  // Generate actionable suggestions backed by actual itinerary elements
  const suggestions = [];

  // 1. Check for paid activities that can be removed
  let highestPaidActivity = null;
  itinerary.days_plan.forEach((day) => {
    day.items.forEach((item) => {
      if (item.type !== "restaurant" && item.cost > 0) {
        if (!highestPaidActivity || item.cost > highestPaidActivity.item.cost) {
          highestPaidActivity = { dayNumber: day.day, item };
        }
      }
    });
  });

  if (highestPaidActivity) {
    const savings = highestPaidActivity.item.cost * travelers;
    suggestions.push({
      id: "remove_paid_activity",
      title: `Remove ${highestPaidActivity.item.name}`,
      subtitle: `Save ${formatRupees(savings)} across ${travelers} traveler${travelers > 1 ? "s" : ""}`,
      savings,
      actionType: "remove_activity",
      dayNumber: highestPaidActivity.dayNumber,
      itemId: highestPaidActivity.item.id,
    });
  }

  // 2. Check for Taxi rides that can be changed to Scooter
  const taxiRides = [];
  itinerary.days_plan.forEach((day) => {
    day.items.forEach((item) => {
      if (item.transportation?.mode === "Taxi") {
        taxiRides.push({ dayNumber: day.day, itemId: item.id });
      }
    });
  });

  if (taxiRides.length >= 2) {
    const targetRides = taxiRides.slice(0, 2);
    const savings = (200 - 80) * targetRides.length; // Taxi 200 -> Scooter 80 (₹120 saved per ride)
    suggestions.push({
      id: "switch_taxi_scooter",
      title: `Switch ${targetRides.length} taxi rides to scooter`,
      subtitle: `Save ${formatRupees(savings)} on local transit`,
      savings,
      actionType: "switch_transport_scooter",
      rides: targetRides,
    });
  }

  // 3. Check for expensive restaurant that can be replaced with lighter dining
  let highestRestaurant = null;
  itinerary.days_plan.forEach((day) => {
    day.items.forEach((item) => {
      if (item.type === "restaurant" && item.cost >= 800) {
        if (!highestRestaurant || item.cost > highestRestaurant.item.cost) {
          highestRestaurant = { dayNumber: day.day, item };
        }
      }
    });
  });

  if (highestRestaurant && highestRestaurant.item.cost > 650) {
    const savings = (highestRestaurant.item.cost - 650) * travelers;
    suggestions.push({
      id: "replace_expensive_meal",
      title: `Replace ${highestRestaurant.item.name} with lighter dining`,
      subtitle: `Save ${formatRupees(savings)} with a casual Goan cafe`,
      savings,
      actionType: "replace_meal",
      dayNumber: highestRestaurant.dayNumber,
      itemId: highestRestaurant.item.id,
    });
  }

  return {
    budget,
    totalCost,
    travelers,
    isOverBudget,
    difference: absDiff,
    statusText: isOverBudget
      ? `Your trip is ${formatRupees(absDiff)} over your planned budget.`
      : `You're ${formatRupees(absDiff)} under your planned budget.`,
    contributors: [
      { name: "Activities", amount: breakdown.activities, pct: activitiesPct },
      { name: "Food", amount: breakdown.food, pct: foodPct },
      { name: "Transportation", amount: breakdown.transportation, pct: transportPct },
    ],
    suggestions,
  };
}

/**
 * FEATURE 7: Weather-Aware Planning Layer
 */
const MOCK_FORECASTS = [
  { condition: "Sunny & Clear", temp: 32, rainChance: 10, icon: "sun" },
  { condition: "Partly Cloudy", temp: 31, rainChance: 20, icon: "cloud-sun" },
  { condition: "Passing Showers", temp: 28, rainChance: 65, icon: "cloud-rain" },
  { condition: "Breezy & Warm", temp: 30, rainChance: 15, icon: "sun" },
  { condition: "Tropical Rain", temp: 27, rainChance: 75, icon: "cloud-rain" },
];

export function getMockWeatherForDay(dayNumber, day) {
  const index = Math.max(0, (dayNumber - 1) % MOCK_FORECASTS.length);
  const forecast = MOCK_FORECASTS[index];

  const outdoorCategories = new Set(["Beaches", "Adventure", "Nature", "Shopping"]);
  const outdoorStops = (day?.items || []).filter(
    (item) => outdoorCategories.has(item.category) || /beach|stroll|trail/i.test(item.name)
  );

  const hasRainRisk = forecast.rainChance >= 50;

  let advisory = "Good conditions for outdoor activities.";
  let suggestion = "";

  if (hasRainRisk) {
    if (outdoorStops.length > 0) {
      advisory = "Rain may affect some outdoor activities today.";
      suggestion = `Consider moving ${outdoorStops[0].name} to another day or choosing an indoor heritage stop.`;
    } else {
      advisory = "Passing showers forecast, but your stops are well-suited for indoor visits.";
      suggestion = "Keep an umbrella handy between stops.";
    }
  }

  return {
    dayNumber,
    condition: forecast.condition,
    temp: forecast.temp,
    rainChance: forecast.rainChance,
    icon: forecast.icon,
    hasRainRisk,
    advisory,
    suggestion,
    outdoorStopsCount: outdoorStops.length,
    isMock: true,
  };
}

/**
 * FEATURE 8: Trip Style / Why this Itinerary
 */
export function calculateTripStyle(itinerary) {
  if (!itinerary?.days_plan) return null;

  const categoryCounts = {};
  let totalItems = 0;

  itinerary.days_plan.forEach((day) => {
    day.items.forEach((item) => {
      const cat = item.category || "Discovery";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      totalItems += 1;
    });
  });

  if (totalItems === 0) return null;

  // Calculate clean rounded percentages
  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalItems) * 100),
    }))
    .filter((c) => c.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  // Normalize sum to 100%
  const currentSum = categories.reduce((sum, c) => sum + c.pct, 0);
  if (categories.length && currentSum !== 100) {
    categories[0].pct += 100 - currentSum;
  }

  const topCategories = categories.slice(0, 2).map((c) => c.name.toLowerCase());
  const explanation = topCategories.length >= 2
    ? `SETUVIA prioritized ${topCategories[0]} and ${topCategories[1]} because they were your strongest preferences.`
    : topCategories.length === 1
    ? `SETUVIA shaped your days around ${topCategories[0]} experiences.`
    : "SETUVIA balanced your itinerary across coastal and cultural highlights.";

  return {
    categories,
    explanation,
    paceNote: `Scheduled with a ${itinerary.pace || "Balanced"} pace in mind.`,
  };
}

/**
 * FEATURE 6: Packing Assistant ("Your Trip Kit")
 */
export function generateTripKit(itinerary) {
  if (!itinerary?.days_plan) return [];

  const categories = new Set();
  itinerary.days_plan.forEach((day) => {
    day.items.forEach((item) => {
      if (item.category) categories.add(item.category);
    });
  });

  const kit = [
    {
      group: "Essentials",
      items: [
        { id: "pack-sunscreen", label: "Sunscreen (SPF 50+)", desc: "Essential for Goa coastal sun" },
        { id: "pack-sunglasses", label: "Sunglasses & sun hat", desc: "For daytime walking and beach stops" },
        { id: "pack-shoes", label: "Comfortable walking footwear", desc: "For fort walks and Panjim lanes" },
        { id: "pack-powerbank", label: "Power bank", desc: "For camera and navigation through the day" },
        { id: "pack-bottle", label: "Reusable water bottle", desc: "Stay hydrated between stops" },
      ],
    },
  ];

  if (categories.has("Beaches") || categories.has("Wellness")) {
    kit.push({
      group: "Beach & Coast",
      items: [
        { id: "pack-swimwear", label: "Swimwear & change of clothes", desc: "For beach swims and shacks" },
        { id: "pack-towel", label: "Quick-dry microfiber towel", desc: "Lightweight and easy to carry" },
        { id: "pack-waterproof", label: "Waterproof pouch", desc: "Protects phone from sand and water" },
      ],
    });
  }

  if (categories.has("Adventure") || categories.has("Nature")) {
    kit.push({
      group: "Adventure & Outdoors",
      items: [
        { id: "pack-trailshoes", label: "Grip footwear / trail shoes", desc: "For spice plantation or waterfall trails" },
        { id: "pack-repellent", label: "Insect repellent spray", desc: "Recommended for garden and forested areas" },
        { id: "pack-daypack", label: "Compact daypack", desc: "To carry essentials on longer day excursions" },
      ],
    });
  }

  if (categories.has("Culture") || categories.has("Heritage")) {
    kit.push({
      group: "Heritage & Modesty",
      items: [
        { id: "pack-modest", label: "Shoulder / knee-covering scarf", desc: "Required for Old Goa churches and temples" },
      ],
    });
  }

  if (categories.has("Nightlife") || categories.has("Food")) {
    kit.push({
      group: "Evening & Dining",
      items: [
        { id: "pack-evening", label: "Smart casual evening outfit", desc: "For garden bistros and riverside evening cruises" },
      ],
    });
  }

  // Weather item
  kit.push({
    group: "Weather Comfort",
    items: [
      { id: "pack-umbrella", label: "Compact travel umbrella", desc: "Handy for unexpected tropical passing showers" },
    ],
  });

  return kit;
}
