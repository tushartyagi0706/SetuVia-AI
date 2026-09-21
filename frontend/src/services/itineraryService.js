import mockItinerary from "../data/mockItinerary.json";

const GENERATE_DELAY_MS = 4200;
const MODIFY_DELAY_MS = 900;
const TRANSPORT_MODES = {
  Taxi: { duration: 25, cost: 200 },
  Scooter: { duration: 30, cost: 80 },
  "Rental Car": { duration: 22, cost: 300 },
  "Public Transport": { duration: 45, cost: 40 },
  Walk: { duration: 55, cost: 0 },
};
const DEFAULT_TRAVELERS = 2;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function endDateFor(startDate, days) {
  const end = new Date(`${startDate || "2026-10-10"}T00:00:00`);
  end.setDate(end.getDate() + Number(days || 1) - 1);
  return [end.getFullYear(), String(end.getMonth() + 1).padStart(2, "0"), String(end.getDate()).padStart(2, "0")].join("-");
}

function travelerCount(itinerary) {
  return Math.min(15, Math.max(1, Number(itinerary.travelers) || DEFAULT_TRAVELERS));
}

function calculateTripCost(itinerary) {
  const travelers = travelerCount(itinerary);
  const breakdown = itinerary.days_plan.reduce(
    (total, day) => {
      day.items.forEach((item) => {
        const cost = Number(item.cost || 0);
        if (item.type === "restaurant") total.food += cost * travelers;
        else total.activities += cost * travelers;
        total.transportation += Number(item.transportation?.estimatedCost || 0);
      });
      return total;
    },
    { activities: 0, food: 0, transportation: 0 }
  );
  breakdown.total = breakdown.activities + breakdown.food + breakdown.transportation;
  breakdown.perPerson = Math.round(breakdown.total / travelers);
  return breakdown;
}

function buildTripHeadline(preferences, days) {
  const interests = new Set(preferences.interests || []);
  const fast = preferences.pace === "Fast-Paced";
  const relaxed = preferences.pace === "Relaxed";
  const has = (...values) => values.some((value) => interests.has(value));

  if (has("Adventure") && has("Nature")) {
    return fast
      ? "An adventurous escape through Goa's wild side"
      : "Goa's wild side, at your own pace";
  }
  if (has("Heritage", "Culture") && has("Food")) {
    return "A flavorful journey through Goa's heritage";
  }
  if (has("Heritage", "Culture")) {
    return "Goa through its heritage, stories, and old streets";
  }
  if (has("Nightlife") && has("Beaches")) {
    return "Sunsets, shores, and Goa after dark";
  }
  if (has("Food")) {
    return "A flavorful journey through Goa";
  }
  if (has("Beaches") && has("Nature") && relaxed) {
    return "A slow, coastal rhythm through Goa";
  }
  if (has("Beaches") && has("Culture")) {
    return "Beaches, heritage, and the best of Goa at your pace";
  }
  if (has("Beaches")) return "Goa's shores, shaped around your journey";
  if (days.some((day) => day.items.some((item) => item.category === "Adventure"))) {
    return "A lively Goa escape built for discovery";
  }
  return "Your personalized Goa journey";
}

function timeToMinutes(value) {
  const match = String(value).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9 * 60;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
}

function minutesToTime(total) {
  const safe = Math.max(0, total);
  const hours = Math.floor(safe / 60) % 24;
  const minutes = safe % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function normalizeTime(value) {
  const input = String(value).trim().toUpperCase();
  const compact = input.match(/^(\d{3,4})\s*(AM|PM)?$/);
  if (compact) {
    const digits = compact[1].padStart(4, "0");
    let hours = Number(digits.slice(0, -2));
    const minutes = Number(digits.slice(-2));
    if (hours > 23 || minutes > 59) return input;
    if (compact[2]) {
      hours %= 12;
      if (compact[2] === "PM") hours += 12;
    }
    return minutesToTime(hours * 60 + minutes);
  }
  const numeric = input.match(/^(\d{1,2})(?::?(\d{2}))?\s*(AM|PM)?$/);
  if (!numeric) return input;
  let hours = Number(numeric[1]);
  const minutes = Number(numeric[2] || 0);
  const suffix = numeric[3];
  if (hours > 23 || minutes > 59) return input;
  if (suffix) {
    hours %= 12;
    if (suffix === "PM") hours += 12;
  }
  if (!suffix && hours <= 23) return minutesToTime(hours * 60 + minutes);
  return minutesToTime(hours * 60 + minutes);
}

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

function activityEndMinutes(item) {
  return timeToMinutes(item.time) + durationToMinutes(item.duration);
}

function earliestStartFor(day, index) {
  if (index <= 0) return 0;
  const previous = day.items[index - 1];
  return activityEndMinutes(previous) + transportDurationToMinutes(
    day.items[index].transportation?.duration
  );
}

function validateSchedule(day, fromIndex = 0) {
  for (let index = Math.max(1, fromIndex); index < day.items.length; index += 1) {
    const earliest = earliestStartFor(day, index);
    const actual = timeToMinutes(day.items[index].time);
    if (actual < earliest) {
      return {
        valid: false,
        index,
        earliest,
        message: `That time overlaps with ${day.items[index - 1].name}. The earliest available time is ${minutesToTime(earliest)}.`,
      };
    }
  }
  return { valid: true };
}

function formatFinishTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const nextDayHours = hours % 24 || 12;
    const suffix = (hours % 24) >= 12 ? "PM" : "AM";
    return `${nextDayHours}:${String(minutes).padStart(2, "0")} ${suffix} next day`;
  }
  return minutesToTime(totalMinutes);
}

function shiftFollowingActivities(day, startIndex) {
  const candidateTimes = [];
  for (let index = startIndex + 1; index < day.items.length; index += 1) {
    const prevTime = index === startIndex + 1
      ? timeToMinutes(day.items[startIndex].time)
      : candidateTimes[candidateTimes.length - 1];
    const prevDuration = durationToMinutes(day.items[index - 1].duration);
    const transit = transportDurationToMinutes(day.items[index].transportation?.duration);
    const earliest = prevTime + prevDuration + transit;
    const duration = durationToMinutes(day.items[index].duration);
    const scheduledStart = Math.max(earliest, timeToMinutes(day.items[index].time));

    if (scheduledStart + duration > 24 * 60) {
      return `Adjusting the schedule would move ${day.items[index].name} beyond the end of the day (${formatFinishTime(scheduledStart + duration)}). Try choosing an earlier time or removing an activity.`;
    }
    candidateTimes.push(scheduledStart);
  }

  candidateTimes.forEach((start, idx) => {
    day.items[startIndex + 1 + idx].time = minutesToTime(start);
  });
  return "";
}

function projectDaySchedule(day, startIndex = 0, newStartTime = null) {
  const clonedDay = clone(day);
  if (!clonedDay?.items || clonedDay.items.length === 0) {
    return { valid: true, day: clonedDay, items: [] };
  }

  if (newStartTime !== null) {
    clonedDay.items[startIndex].time = newStartTime;
  }

  clonedDay.items = clonedDay.items.map((item, idx) => ({
    ...item,
    transportation: idx === 0 ? null : item.transportation || transportFor(idx),
  }));

  const startMinutes = timeToMinutes(clonedDay.items[startIndex].time);
  const startDuration = durationToMinutes(clonedDay.items[startIndex].duration);
  if (startMinutes + startDuration > 24 * 60) {
    return {
      valid: false,
      overflowItem: clonedDay.items[startIndex].name,
      overflowTime: formatFinishTime(startMinutes + startDuration),
      error: `${clonedDay.items[startIndex].name} would finish after midnight (${formatFinishTime(startMinutes + startDuration)}).`,
    };
  }

  const shiftError = shiftFollowingActivities(clonedDay, startIndex);
  if (shiftError) {
    const overflowItemMatch = shiftError.match(/move (.*?) beyond/);
    const overflowItem = overflowItemMatch ? overflowItemMatch[1] : clonedDay.items[clonedDay.items.length - 1].name;
    const overflowTimeMatch = shiftError.match(/\((.*?)\)/);
    const overflowTime = overflowTimeMatch ? overflowTimeMatch[1] : "past midnight";
    return {
      valid: false,
      overflowItem,
      overflowTime,
      error: shiftError,
    };
  }

  return { valid: true, day: clonedDay, items: clonedDay.items };
}

function rearrangeSingleDay(day) {
  if (!day?.items || day.items.length <= 1) {
    return { valid: true, items: day ? clone(day.items) : [] };
  }
  const dayStartTime = day.items[0].time;
  const reversed = clone(day.items).reverse();
  reversed[0].time = dayStartTime;
  reversed[0].transportation = null;

  for (let i = 1; i < reversed.length; i += 1) {
    reversed[i].transportation = reversed[i].transportation || transportFor(i);
  }

  const tempDay = { ...day, items: reversed };
  const startMinutes = timeToMinutes(reversed[0].time);
  const startDuration = durationToMinutes(reversed[0].duration);
  if (startMinutes + startDuration > 24 * 60) {
    return {
      valid: false,
      error: `Rearranging Day ${day.day} would push ${reversed[0].name} past midnight (${formatFinishTime(startMinutes + startDuration)}). I kept your existing schedule.`,
    };
  }

  const shiftError = shiftFollowingActivities(tempDay, 0);
  if (shiftError) {
    return {
      valid: false,
      error: `Rearranging Day ${day.day} would push activities past midnight. I kept your existing schedule.`,
    };
  }

  return { valid: true, items: tempDay.items };
}

function transportFor(index) {
  if (index === 0) return null;
  return { mode: "Taxi", duration: "25 min", estimatedCost: 200 };
}

function recalculateDay(day) {
  day.items = day.items.map((item, index) => ({
    ...item,
    transportation: index === 0 ? null : item.transportation || transportFor(index),
  }));
  shiftFollowingActivities(day, 0);
  return day;
}

function sortItemsChronologically(day) {
  day.items.sort((left, right) => timeToMinutes(left.time) - timeToMinutes(right.time));
  return day;
}

export function normalizeLiveItineraryResponse(rawItinerary, preferences = {}) {
  if (!rawItinerary) return null;
  const next = clone(rawItinerary);

  // Extract raw days array (backend returns 'days', local state may use 'days_plan')
  const rawDays = next.days_plan || next.days || [];

  const normalizedDays = rawDays.map((day, dIdx) => {
    const rawItems = day.items || day.slots || [];

    const normalizedItems = rawItems.map((item, iIdx) => {
      const type = (item.type || item.item_type || "place").toLowerCase();
      const cost = typeof item.cost === "number" ? item.cost : (item.estimated_cost_inr || 0);
      const id = String(item.id || item.item_id || `d${day.day || dIdx + 1}-${iIdx + 1}-${iIdx}`);
      const durationHours = typeof item.estimated_duration_hours === "number"
        ? item.estimated_duration_hours
        : (item.duration ? parseFloat(item.duration) || 1.5 : 1.5);
      const duration = item.duration || `${durationHours} ${durationHours === 1 ? "hour" : "hours"}`;

      let time = item.time;
      if (!time) {
        const slotUpper = String(item.slot || "").toUpperCase();
        if (slotUpper.includes("MORNING")) time = "09:00 AM";
        else if (slotUpper.includes("LUNCH")) time = "01:00 PM";
        else if (slotUpper.includes("AFTERNOON")) time = "03:30 PM";
        else if (slotUpper.includes("EVENING")) time = "06:30 PM";
        else if (slotUpper.includes("DINNER")) time = "08:30 PM";
        else {
          const defaultTimes = ["09:00 AM", "01:00 PM", "04:00 PM", "07:30 PM"];
          time = defaultTimes[iIdx % defaultTimes.length];
        }
      }

      const category = item.category || (type === "restaurant" ? "Dining" : type === "activity" ? "Activity" : "Attraction");
      const rating = typeof item.rating === "number" ? item.rating : 4.5;
      const location = item.location || item.location_area || item.area || "Goa";
      const description = item.description || item.notes_or_tips || item.notes || `${item.name} in ${location}.`;

      const image = item.image || item.image_url || item.details?.image_url || item.details?.image || "";

      return {
        ...item,
        id,
        item_id: id,
        name: item.name || "Goa Experience",
        type,
        item_type: type,
        category,
        cost,
        estimated_cost_inr: cost,
        rating,
        image,
        image_url: image,
        duration,
        time,
        description,
        notes: description,
        location,
        location_area: location,
        latitude: item.latitude || 15.498,
        longitude: item.longitude || 73.827,
        transportation: iIdx === 0 ? null : (item.transportation || transportFor(iIdx))
      };
    });

    const dayNumber = day.day || dIdx + 1;
    const dateStr = day.date || (() => {
      const date = new Date(`${preferences.startDate || "2026-10-10"}T00:00:00`);
      date.setDate(date.getDate() + dayNumber - 1);
      return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    })();

    const presentation = buildDayPresentation(normalizedItems, {
      pace: preferences.pace || preferences.travel_pace || next.pace || "Balanced"
    });

    return {
      day: dayNumber,
      date: dateStr,
      title: day.title || presentation.title,
      theme: day.theme || presentation.theme || day.area_cluster || "Goa Highlights",
      area_cluster: day.area_cluster || day.theme || "Goa Cluster",
      items: normalizedItems,
      slots: normalizedItems
    };
  });

  next.days_plan = normalizedDays;
  next.days = normalizedDays.length || Number(next.days || next.total_days || preferences.days || 3);
  next.total_days = next.days;
  next.destination = next.destination || preferences.destination || "Goa";
  next.travelers = Math.max(1, Number(preferences.travelers || next.travelers || DEFAULT_TRAVELERS));
  next.budget = Number(preferences.budget || next.budget || 25000);
  next.pace = preferences.pace || preferences.travel_pace || next.pace || "Balanced";
  next.food_preference = preferences.food_preference || next.food_preference || "Any";
  next.interests = preferences.interests || next.interests || ["Beaches"];

  if (preferences.selected_stay || preferences.selectedStay) {
    next.selected_stay = preferences.selected_stay || preferences.selectedStay;
    next.selectedStay = next.selected_stay;
  }

  next.headline = next.narrative_summary || next.headline || buildTripHeadline(preferences, normalizedDays);
  next.narrative_summary = next.headline;

  next.cost_breakdown = calculateTripCost(next);
  next.estimated_cost = typeof next.total_estimated_cost_inr === "number"
    ? next.total_estimated_cost_inr
    : next.cost_breakdown.total;
  next.estimated_per_person = next.cost_breakdown.perPerson;

  return next;
}

export function recalculateItineraryData(itinerary) {
  return normalizeLiveItineraryResponse(itinerary, itinerary);
}

function maxItemsForPace(pace) {
  if (pace === "Relaxed") return 3;
  if (pace === "Fast-Paced") return 6;
  return 4;
}

function dietMatches(item, foodPreference) {
  if (item.type !== "restaurant" || foodPreference === "Any") return false;

  const dietAliases = {
    Veg: "Vegetarian",
    "Non-Veg": "Non-vegetarian",
    Seafood: "Non-vegetarian",
    Jain: "Vegetarian",
  };
  return item.diet?.includes(dietAliases[foodPreference]) || false;
}

function isSeafood(item) {
  return /seafood|fish|prawn|shrimp|shellfish/i.test(
    `${item.name} ${item.description}`
  );
}

function interestScore(item, interests) {
  if (!interests?.length) return 0;

  const relatedCategories = {
    Heritage: ["Culture"],
    Culture: ["Heritage", "Culture"],
    Food: ["Food"],
  };
  const matchingInterest = interests.find((interest) =>
    [interest, ...(relatedCategories[interest] || [])].includes(item.category)
  );

  if (matchingInterest) return 24;
  if (item.type === "restaurant" && interests.includes("Food")) return 28;
  return -4;
}

function foodScore(item, foodPreference) {
  if (item.type !== "restaurant") return 0;
  if (foodPreference === "Any") return 3;
  if (foodPreference === "Seafood") return isSeafood(item) ? 18 : -8;
  if (foodPreference === "Jain") return dietMatches(item, foodPreference) ? 10 : -5;
  return dietMatches(item, foodPreference) ? 14 : -12;
}

function budgetScore(item, preferences) {
  if (item.cost === 0) return 8;
  const dailyBudget = Number(preferences.budget) / Number(preferences.days || 1);
  const difference = item.cost - dailyBudget;

  if (item.cost > dailyBudget * 2) return -40;
  if (difference <= 0) return 7;
  return -Math.min(24, Math.ceil(difference / 200));
}

function candidateScore(candidate, preferences, template) {
  return (
    interestScore(candidate.item, preferences.interests) +
    foodScore(candidate.item, preferences.food_preference) +
    budgetScore(candidate.item, preferences) +
    (candidate.sourceDay === template.day ? 3 : 0) +
    (candidate.item.type === "restaurant" ? 2 : 0)
  );
}

function buildDayPresentation(items, preferences) {
  const categoryCounts = items.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
  const categories = Object.entries(categoryCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([category]) => category)
    .slice(0, 2);
  const focus = categories.join(" and ") || "personalized experiences";

  return {
    title: categories.length ? `${focus} focus` : "Personalized day",
    theme: `${preferences.pace} day with ${focus.toLowerCase()}`,
  };
}

function sumCost(days) {
  return days.reduce(
    (total, day) =>
      total + day.items.reduce((dayTotal, item) => dayTotal + (item.cost || 0), 0),
    0
  );
}

function buildDays(preferences) {
  const source = clone(mockItinerary);
  const requestedDays = Math.min(14, Math.max(1, Number(preferences.days) || 3));
  const maxItems = maxItemsForPace(preferences.pace);
  const templates = source.days_plan;
  const candidates = [
    ...templates.flatMap((day) =>
      day.items.map((item) => ({ item, sourceDay: day.day }))
    ),
    ...(source.extras || []).map((item) => ({ item, sourceDay: null })),
  ];
  const days = [];

  for (let i = 0; i < requestedDays; i += 1) {
    const template = clone(templates[i % templates.length]);
    const dayNumber = i + 1;

    const ranked = candidates
      .map((candidate, candidateIndex) => ({
        ...candidate,
        candidateIndex,
        score: candidateScore(candidate, preferences, template),
      }))
      .sort((left, right) => {
        const scoreDifference = right.score - left.score;
        if (scoreDifference !== 0) return scoreDifference;
        return (
          (left.candidateIndex + i * 3) % candidates.length -
          (right.candidateIndex + i * 3) % candidates.length
        );
      });

    const selected = [];
    ranked.forEach((candidate) => {
      if (selected.length >= maxItems) return;
      if (selected.some((item) => item.name === candidate.item.name)) return;
      selected.push(candidate.item);
    });

    if (maxItems > 1 && !selected.some((item) => item.type === "restaurant")) {
      const preferredRestaurant = ranked.find(
        (candidate) =>
          candidate.item.type === "restaurant" &&
          (preferences.food_preference === "Any" ||
            foodScore(candidate.item, preferences.food_preference) > 0)
      );
      if (preferredRestaurant) {
        selected.splice(Math.max(0, selected.length - 1), 1, preferredRestaurant.item);
      }
    }

    const items = selected.map((item, index) => ({
      ...item,
      id: `d${dayNumber}-${index + 1}-${item.id}`,
    }));
    const dayItems = recalculateDay(sortItemsChronologically({ items })).items;
    const presentation = buildDayPresentation(dayItems, preferences);

    days.push({
      day: dayNumber,
      date: (() => {
        const date = new Date(`${preferences.startDate || "2026-10-10"}T00:00:00`);
        date.setDate(date.getDate() + dayNumber - 1);
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
      })(),
      title: presentation.title,
      theme: presentation.theme,
      items: dayItems,
    });
  }

  return days;
}

function buildItinerary(preferences) {
  const days = buildDays(preferences);
  const estimated_cost = sumCost(days);

  return {
    destination: preferences.destination.trim(),
    days: preferences.days,
    startDate: preferences.startDate || "2026-10-10",
    endDate: preferences.endDate || endDateFor(preferences.startDate, preferences.days),
    travelers: Math.min(15, Math.max(1, Number(preferences.travelers) || DEFAULT_TRAVELERS)),
    budget: preferences.budget,
    interests: [...preferences.interests],
    pace: preferences.pace,
    food_preference: preferences.food_preference,
    headline: buildTripHeadline(preferences, days),
    estimated_cost,
    days_plan: days,
    extras: clone(mockItinerary.extras),
  };
}

function addUniqueItem(day, extra, prefix) {
  if (!extra) return false;
  if (day.items.some((item) => item.name === extra.name)) return false;
  day.items.push({
    ...clone(extra),
    id: `${prefix}-${Date.now()}`,
  });
  return true;
}

function applyMockModification(itinerary, message) {
  const next = clone(itinerary);
  const query = message.toLowerCase();
  const dayMatch = query.match(/day\s*(\d+)/);
  const dayNumber = dayMatch ? Number(dayMatch[1]) : null;
  const extras = next.extras || [];
  let reply =
    "I've noted that. For this preview I'm keeping the current plan, but a live SETUVIA model will reshape it from your note.";

  if (query.includes("relax") || query.includes("free time")) {
    const targetDay =
      next.days_plan.find((day) => day.day === (dayNumber || 2)) ||
      next.days_plan[1] ||
      next.days_plan[0];

    if (targetDay) {
      const keep = [];
      targetDay.items.forEach((item, index) => {
        if (index === 0 || item.type === "restaurant" || index === targetDay.items.length - 1) {
          keep.push(item);
        }
      });
      const unique = [];
      keep.forEach((item) => {
        if (!unique.some((existing) => existing.id === item.id)) unique.push(item);
      });
      targetDay.items = unique.slice(0, 3);
      addUniqueItem(
        targetDay,
        extras.find((item) => item.category === "Wellness") || extras[0],
        "relax"
      );
      targetDay.theme = "More open hours and fewer stops";
      reply = `Done. I've reduced the number of activities on Day ${targetDay.day} and added more free time.`;
    }
  } else if (query.includes("expensive") || query.includes("reduce my budget") || query.includes("lower my budget")) {
    next.days_plan.forEach((day) => {
      day.items = day.items.filter((item) => (item.cost || 0) < 1000);
    });
    reply = "Done. I removed the costlier activities so the days stay closer to a lighter spend.";
  } else if (query.includes("beach")) {
    let added = 0;
    const beach = extras.find((item) => item.category === "Beaches");
    next.days_plan.forEach((day) => {
      if (added < 2 && addUniqueItem(day, beach, "beach")) added += 1;
    });
    reply = added
      ? "Done. I've added more beach time to the plan so the trip leans back toward the water."
      : "Your plan already has plenty of beach time, so I left the days as they are.";
  } else if (query.includes("cultur")) {
    const culture = extras.find((item) => item.category === "Culture");
    const day = next.days_plan.find((entry) => entry.day === (dayNumber || 2)) || next.days_plan[0];
    const added = addUniqueItem(day, culture, "culture");
    reply = added
      ? "Done. I added another cultural stop so the days feel more rooted in Goa's history."
      : "I looked for another cultural stop, but that place is already on your itinerary.";
  } else if (query.includes("nightlife") || query.includes("night life")) {
    const nightlife = mockItinerary.days_plan
      .flatMap((day) => day.items)
      .find((item) => item.category === "Nightlife");
    const day = next.days_plan.find((entry) => entry.day === (dayNumber || 2)) || next.days_plan[0];
    const added = addUniqueItem(day, nightlife, "nightlife");
    reply = added
      ? "Done. I added an evening experience so the itinerary has more nightlife."
      : "A nightlife experience is already on that day, so I kept the evening as it is.";
  } else if (query.includes("adventur")) {
    const adventure = extras.find((item) => item.category === "Adventure");
    const day = next.days_plan.find((entry) => entry.day === (dayNumber || 1)) || next.days_plan[0];
    const added = addUniqueItem(day, adventure, "adventure");
    reply = added
      ? "Done. I added a more adventurous experience to the journey."
      : "An adventure experience is already on that day, so I kept the plan as it is.";
  } else if (query.includes("start")) {
    const timeMatch =
      query.match(/(?:at|from)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i) ||
      query.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    let requestedTime = "1:00 PM";
    if (timeMatch) {
      const normalized = normalizeTime(timeMatch[1]);
      if (/^\d{1,2}:\d{2} (AM|PM)$/i.test(normalized)) {
        requestedTime = normalized;
      }
    } else if (query.includes("1 pm") || query.includes("1:00 pm")) {
      requestedTime = "1:00 PM";
    }
    const targetDay =
      next.days_plan.find((day) => day.day === (dayNumber || 2)) ||
      next.days_plan[0];

    if (!targetDay || !targetDay.items.length) {
      reply = "I couldn't find any activities on that day to reschedule.";
    } else {
      const projection = projectDaySchedule(targetDay, 0, requestedTime);
      if (!projection.valid) {
        reply = `Starting Day ${targetDay.day} at ${requestedTime} does not fit the remaining activities because ${projection.overflowItem} would finish past midnight (${projection.overflowTime}). Try choosing an earlier start time or removing some activities first.`;
      } else {
        targetDay.items = projection.items;
        reply = `Done. Day ${targetDay.day} now starts at ${requestedTime}, and the schedule has been adjusted.`;
      }
    }
  } else if (query.includes("rearrange") || query.includes("reorder")) {
    if (dayNumber !== null) {
      const targetDay = next.days_plan.find((day) => day.day === dayNumber);
      if (!targetDay) {
        reply = `I couldn't find Day ${dayNumber} in your itinerary.`;
      } else if (targetDay.items.length <= 1) {
        reply = `Day ${targetDay.day} only has one activity, so its order was kept.`;
      } else {
        const result = rearrangeSingleDay(targetDay);
        if (!result.valid) {
          reply = result.error;
        } else {
          targetDay.items = result.items;
          reply = `Done. I rearranged Day ${targetDay.day} so the sequence has a different rhythm.`;
        }
      }
    } else {
      let anyError = "";
      const dayUpdates = [];
      for (const day of next.days_plan) {
        if (day.items.length > 1) {
          const result = rearrangeSingleDay(day);
          if (!result.valid) {
            anyError = result.error;
            break;
          }
          dayUpdates.push({ day, items: result.items });
        }
      }
      if (anyError) {
        reply = anyError;
      } else {
        dayUpdates.forEach(({ day, items }) => {
          day.items = items;
        });
        reply = "Done. I rearranged your itinerary days so the sequence has a different rhythm.";
      }
    }
  } else if (query.includes("travel time") || query.includes("less travel") || query.includes("reduce travel")) {
    next.days_plan.forEach((day) => {
      if (day.items.length > 3) {
        day.items = day.items.slice(0, 3);
      }
      day.theme = "Kept closer together to cut moving around";
    });
    reply = "Done. I tightened each day so you spend less time moving between distant stops.";
  } else if (query.includes("food") || query.includes("restaurant") || query.includes("eat")) {
    const meal = extras.find((item) => item.type === "restaurant");
    const day = next.days_plan.find((entry) => entry.day === (dayNumber || 1)) || next.days_plan[0];
    const added = addUniqueItem(day, meal, "food");
    reply = added
      ? "Done. I added another food stop so the trip has more time at the table."
      : "A similar meal is already on the itinerary, so I kept the dining as is.";
  }

  next.estimated_cost = sumCost(next.days_plan);
  return { itinerary: next, reply };
}

/**
 * Service layer for itinerary generation.
 * UI code should call these functions only — not the mock JSON file.
 *
 * Later, replace the mock body of generateItinerary with:
 *   fetch(`${import.meta.env.VITE_API_URL}/generate-itinerary`, { ... })
 */
export async function generateItinerary(preferences) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  try {
    let selectedStayPayload = null;
    if (preferences.selected_stay?.stay_id) {
      selectedStayPayload = { stay_id: preferences.selected_stay.stay_id };
    } else if (preferences.selectedStay?.stay_id) {
      selectedStayPayload = { stay_id: preferences.selectedStay.stay_id };
    }

    const payload = {
      destination: preferences.destination || "Goa",
      days: Number(preferences.days) || 3,
      budget: Number(preferences.budget) || 25000,
      interests: preferences.interests || ["Beaches"],
      travel_pace: preferences.pace || "Balanced",
      food_preference: preferences.food_preference || "Any",
      ...(selectedStayPayload ? { selected_stay: selectedStayPayload } : {})
    };

    const response = await fetch(`${API_URL}/api/v1/itinerary/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const liveItinerary = await response.json();
      return normalizeLiveItineraryResponse(liveItinerary, preferences);
    } else {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.detail || `Server returned status ${response.status}`;
      throw new Error(`Itinerary generation failed: ${msg}`);
    }
  } catch (error) {
    console.warn("Live FastAPI Backend call error:", error);
    throw error;
  }
}

export async function modifyItinerary(itinerary, message) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  try {
    const response = await fetch(`${API_URL}/api/v1/itinerary/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_itinerary: itinerary,
        user_request: message
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawModified = data.modified_itinerary || data.itinerary || data;
      return {
        itinerary: normalizeLiveItineraryResponse(rawModified, itinerary),
        reply: data.reply || data.assistant_reply || "I've updated your itinerary based on your request."
      };
    }
  } catch (error) {
    console.warn("Live FastAPI Modify endpoint unavailable, using fallback:", error);
  }

  await wait(MODIFY_DELAY_MS);
  const result = applyMockModification(itinerary, message);
  return { ...result, itinerary: recalculateItineraryData(result.itinerary) };
}

export function removeLocation(itinerary, dayNumber, itemId) {
  const next = clone(itinerary);
  const day = next.days_plan.find((entry) => entry.day === Number(dayNumber));
  if (day) day.items = day.items.filter((item) => item.id !== itemId);
  return recalculateItineraryData(next);
}

export function updateTravelerCount(itinerary, travelers) {
  const next = clone(itinerary);
  next.travelers = Math.min(15, Math.max(1, Number(travelers) || DEFAULT_TRAVELERS));
  return recalculateItineraryData(next);
}

export function reorderLocations(itinerary, dayNumber, itemId, direction) {
  const next = clone(itinerary);
  const day = next.days_plan.find((entry) => entry.day === Number(dayNumber));
  if (!day) return next;
  const index = day.items.findIndex((item) => item.id === itemId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= day.items.length) return next;
  [day.items[index], day.items[target]] = [day.items[target], day.items[index]];
  const scheduleError = shiftFollowingActivities(day, 0);
  if (scheduleError) return { itinerary, error: scheduleError };
  return { itinerary: recalculateItineraryData(next), error: "" };
}

export function updateActivityTime(itinerary, dayNumber, itemId, time, adjustFollowing) {
  const next = clone(itinerary);
  const day = next.days_plan.find((entry) => entry.day === Number(dayNumber));
  if (!day) return { itinerary: next, error: "That itinerary day could not be found." };
  const index = day.items.findIndex((item) => item.id === itemId);
  if (index < 0) return { itinerary: next, error: "That activity could not be found." };
  const normalizedTime = normalizeTime(time);
  if (!/^\d{1,2}:\d{2} (AM|PM)$/i.test(normalizedTime)) {
    return { itinerary, error: "Enter a valid time, such as 10:00 AM." };
  }
  const duration = durationToMinutes(day.items[index].duration);
  if (timeToMinutes(normalizedTime) + duration > 24 * 60) {
    return {
      itinerary,
      error: `That activity would finish after midnight (${formatFinishTime(timeToMinutes(normalizedTime) + duration)}). Try choosing an earlier time.`,
    };
  }
  day.items[index].time = normalizedTime;
  const chronologicalItems = [...day.items].sort(
    (left, right) => timeToMinutes(left.time) - timeToMinutes(right.time)
  );
  const changesOrder = chronologicalItems[index] !== day.items[index];
  if (changesOrder) {
    const reorderedDay = sortItemsChronologically({ ...day, items: [...day.items] });
    const reorderedError = shiftFollowingActivities(reorderedDay, 0);
    if (reorderedError) return { itinerary, error: reorderedError };
    const reordered = recalculateItineraryData({
      ...next,
      days_plan: next.days_plan.map((entry) =>
        entry.day === Number(dayNumber) ? reorderedDay : entry
      ),
    });
    return {
      itinerary,
      error: `Changing ${day.items[index].name} to ${normalizedTime} changes the order of your itinerary.`,
      reorderItinerary: reordered,
    };
  }
  if (adjustFollowing) {
    const shiftError = shiftFollowingActivities(day, index);
    if (shiftError) return { itinerary, error: shiftError };
  } else {
    const validation = validateSchedule(day, index);
    if (!validation.valid) {
      return { itinerary, error: validation.message };
    }
    if (index < day.items.length - 1) {
      const nextItem = day.items[index + 1];
      const nextTransit = transportDurationToMinutes(nextItem.transportation?.duration);
      const minNextStart = timeToMinutes(normalizedTime) + duration + nextTransit;
      if (timeToMinutes(nextItem.time) < minNextStart) {
        return {
          itinerary,
          error: `That time overlaps with ${nextItem.name}. Use "Adjust schedule" to shift following activities, or choose an earlier time.`,
        };
      }
    }
  }
  return { itinerary: recalculateItineraryData(next), error: "" };
}

export function updateTransportation(itinerary, dayNumber, itemId, mode) {
  const next = clone(itinerary);
  const day = next.days_plan.find((entry) => entry.day === Number(dayNumber));
  const item = day?.items.find((entry) => entry.id === itemId);
  if (item && TRANSPORT_MODES[mode]) {
    item.transportation = {
      mode,
      duration: `${TRANSPORT_MODES[mode].duration} min`,
      estimatedCost: TRANSPORT_MODES[mode].cost,
    };
  }
  return recalculateItineraryData(next);
}

export function regenerateSingleDayPlan(itinerary, dayNumber, preferences = {}) {
  const targetDay = Number(dayNumber);
  const existingDay = itinerary?.days_plan?.find((entry) => entry.day === targetDay);
  if (!existingDay) return itinerary;

  const currentNames = new Set(existingDay.items.map((item) => item.name));
  const source = clone(mockItinerary);
  const templates = source.days_plan;
  const candidates = [
    ...templates.flatMap((day) =>
      day.items.map((item) => ({ item, sourceDay: day.day }))
    ),
    ...(source.extras || []).map((item) => ({ item, sourceDay: null })),
  ];

  const prefs = {
    ...itinerary,
    ...preferences,
  };
  const maxItems = maxItemsForPace(prefs.pace || "Balanced");
  const template = clone(templates[(targetDay - 1) % templates.length]);

  const ranked = candidates
    .map((candidate, candidateIndex) => {
      let score = candidateScore(candidate, prefs, template);
      if (currentNames.has(candidate.item.name)) {
        score -= 50;
      }
      return {
        ...candidate,
        candidateIndex,
        score,
      };
    })
    .sort((left, right) => {
      const diff = right.score - left.score;
      if (diff !== 0) return diff;
      return (
        (left.candidateIndex + targetDay * 5) % candidates.length -
        (right.candidateIndex + targetDay * 5) % candidates.length
      );
    });

  const selected = [];
  ranked.forEach((candidate) => {
    if (selected.length >= maxItems) return;
    if (selected.some((item) => item.name === candidate.item.name)) return;
    selected.push(candidate.item);
  });

  if (maxItems > 1 && !selected.some((item) => item.type === "restaurant")) {
    const preferredRestaurant = ranked.find(
      (c) =>
        c.item.type === "restaurant" &&
        (prefs.food_preference === "Any" || foodScore(c.item, prefs.food_preference) > 0)
    );
    if (preferredRestaurant) {
      selected.splice(Math.max(0, selected.length - 1), 1, preferredRestaurant.item);
    }
  }

  const items = selected.map((item, index) => ({
    ...clone(item),
    id: `d${targetDay}-reg-${Date.now()}-${index + 1}-${item.id}`,
  }));

  const dayItems = recalculateDay(sortItemsChronologically({ items })).items;
  const presentation = buildDayPresentation(dayItems, prefs);

  const nextDay = {
    day: targetDay,
    date: existingDay.date,
    title: presentation.title,
    theme: presentation.theme,
    items: dayItems,
  };

  const nextItinerary = clone(itinerary);
  nextItinerary.days_plan = nextItinerary.days_plan.map((entry) =>
    entry.day === targetDay ? nextDay : entry
  );

  return recalculateItineraryData(nextItinerary);
}

export function addLocation(itinerary, dayNumber, location) {
  const next = clone(itinerary);
  const day = next.days_plan.find((entry) => entry.day === Number(dayNumber));
  if (day && location && !day.items.some((item) => item.name === location.name)) {
    const newItem = { ...clone(location), id: `loc-${Date.now()}` };
    if (day.items.length > 0) {
      const earliest = earliestStartFor({ items: [...day.items, newItem] }, day.items.length);
      newItem.time = minutesToTime(earliest);
    } else {
      newItem.time = "9:00 AM";
    }
    day.items.push(newItem);
    return recalculateItineraryData(next);
  }
  return next;
}

export function getAddableLocations(itinerary, dayNumber) {
  const day = itinerary.days_plan.find((entry) => entry.day === Number(dayNumber));
  const existing = new Set(day?.items.map((item) => item.name));
  return [
    ...mockItinerary.extras,
    ...mockItinerary.days_plan.flatMap((entry) => entry.items),
  ].filter((item, index, all) => !existing.has(item.name) && all.findIndex((candidate) => candidate.name === item.name) === index).slice(0, 6);
}

export const recalculateItinerary = recalculateItineraryData;
export { buildTripHeadline };

export { TRANSPORT_MODES };
export { calculateTripCost };
export {
  activityEndMinutes,
  earliestStartFor,
  validateSchedule,
  shiftFollowingActivities,
  sortItemsChronologically,
  transportFor,
  minutesToTime,
  timeToMinutes,
  durationToMinutes,
};

export const LOADING_STEPS = [
  "Understanding your preferences...",
  "Finding places you'll love...",
  "Building your day-by-day journey...",
  "Optimizing your itinerary...",
];
