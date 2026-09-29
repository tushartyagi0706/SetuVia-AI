import { createContext, useContext, useMemo, useRef, useState } from "react";
import { DEFAULT_PREFERENCES } from "../constants/options.js";
import {
  addLocation,
  generateItinerary,
  getAddableLocations,
  modifyItinerary,
  removeLocation,
  recalculateItinerary,
  reorderLocations,
  updateTravelerCount,
  updateActivityTime,
  updateTransportation,
  regenerateSingleDayPlan,
  sendConciergeChat,
} from "../services/itineraryService.js";
import { optimizeDayRoute } from "../services/routeService.js";
import mockItinerary from "../data/mockItinerary.json";

const TripContext = createContext(null);
const STORAGE_KEY = "setuvia-trip";

const clone = (v) => (v ? JSON.parse(JSON.stringify(v)) : v);

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadSavedStay() {
  try {
    const raw = sessionStorage.getItem("setuvia-selected-stay");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function TripProvider({ children }) {
  const saved = loadSaved();
  const savedStay = loadSavedStay();
  const savedItinerary = saved?.itinerary
    ? recalculateItinerary(saved.itinerary)
    : null;
  const [preferences, setPreferences] = useState(
    { ...DEFAULT_PREFERENCES, ...(saved?.preferences || {}) }
  );
  const [selectedStay, setSelectedStay] = useState(savedStay);
  const [itinerary, setItinerary] = useState(savedItinerary);
  const [messages, setMessages] = useState(saved?.messages || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [modificationError, setModificationError] = useState("");
  const [timeEditError, setTimeEditError] = useState("");
  const [pendingTimeReorder, setPendingTimeReorder] = useState(null);

  function selectStay(stay) {
    setSelectedStay(stay);
    try {
      if (stay) {
        sessionStorage.setItem("setuvia-selected-stay", JSON.stringify(stay));
      } else {
        sessionStorage.removeItem("setuvia-selected-stay");
      }
    } catch { /* noop */ }
  }

  function clearSelectedStay() {
    setSelectedStay(null);
    try {
      sessionStorage.removeItem("setuvia-selected-stay");
    } catch { /* noop */ }
  }
  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem("setuvia-wishlist");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [regeneratingDay, setRegeneratingDay] = useState(null);
  const [regenerateError, setRegenerateError] = useState("");
  const regenerateCancelledRef = useRef(false);

  function persist(next) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences: next.preferences ?? preferences,
        itinerary: next.itinerary ?? itinerary,
        messages: next.messages ?? messages,
      })
    );
  }

  function updatePreferences(nextPreferences) {
    setPreferences(nextPreferences);
    persist({ preferences: nextPreferences, itinerary, messages });
  }

  function applyItineraryChange(nextItinerary) {
    setItinerary(nextItinerary);
    persist({ itinerary: nextItinerary });
  }

  function removeActivity(dayNumber, itemId) {
    applyItineraryChange(removeLocation(itinerary, dayNumber, itemId));
  }

  function moveActivity(dayNumber, itemId, direction) {
    const result = reorderLocations(itinerary, dayNumber, itemId, direction);
    if (!result.error) applyItineraryChange(result.itinerary);
  }

  function editActivityTime(dayNumber, itemId, time, adjustFollowing) {
    const result = updateActivityTime(itinerary, dayNumber, itemId, time, adjustFollowing);
    setTimeEditError(result.error || "");
    if (!result.error) {
      setPendingTimeReorder(null);
      applyItineraryChange(result.itinerary);
    } else if (result.reorderItinerary) {
      setPendingTimeReorder(result.reorderItinerary);
    }
    return result;
  }

  function confirmTimeReorder() {
    if (!pendingTimeReorder) return;
    applyItineraryChange(pendingTimeReorder);
    setPendingTimeReorder(null);
    setTimeEditError("");
  }

  function cancelTimeReorder() {
    setPendingTimeReorder(null);
    setTimeEditError("");
  }

  function changeTransportation(dayNumber, itemId, mode) {
    applyItineraryChange(updateTransportation(itinerary, dayNumber, itemId, mode));
  }

  function addActivity(dayNumber, location) {
    applyItineraryChange(addLocation(itinerary, dayNumber, location));
  }

  function updateTravelers(count) {
    const nextItinerary = updateTravelerCount(itinerary, count);
    setPreferences((current) => ({ ...current, travelers: nextItinerary.travelers }));
    applyItineraryChange(nextItinerary);
    persist({ preferences: { ...preferences, travelers: nextItinerary.travelers }, itinerary: nextItinerary });
  }

  function createItinerary(nextPreferences) {
    const prefs = {
      ...(nextPreferences || preferences),
      ...(selectedStay ? { selected_stay: { stay_id: selectedStay.stay_id }, selectedStay } : {})
    };
    setPreferences(prefs);
    setIsGenerating(true);
    setGenerationError("");
    setMessages([]);
    persist({ preferences: prefs, itinerary: null, messages: [] });

    return generateItinerary(prefs)
      .then((nextItinerary) => {
        setItinerary(nextItinerary);
        persist({ preferences: prefs, itinerary: nextItinerary, messages: [] });
        return nextItinerary;
      })
      .catch((error) => {
        setGenerationError(
          error instanceof Error
            ? error.message
            : "We could not create your itinerary. Please try again."
        );
        return null;
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }

  // Feature 5: Wishlist actions
  function saveToWishlist(item) {
    const already = wishlist.some((w) => w.id === item.id);
    if (already) return;
    const next = [...wishlist, clone(item)];
    setWishlist(next);
    try { localStorage.setItem("setuvia-wishlist", JSON.stringify(next)); } catch { /* noop */ }
  }

  function removeFromWishlist(itemId) {
    const next = wishlist.filter((w) => w.id !== itemId);
    setWishlist(next);
    try { localStorage.setItem("setuvia-wishlist", JSON.stringify(next)); } catch { /* noop */ }
  }

  function addWishlistItemToDay(dayNumber, wishlistItem) {
    if (!itinerary) return;
    const item = { ...clone(wishlistItem), id: `wish-${Date.now()}` };
    applyItineraryChange(addLocation(itinerary, dayNumber, item));
  }

  // Feature 1: Regenerate individual day
  async function regenerateDay(dayNumber) {
    if (!itinerary) return;
    setRegeneratingDay(dayNumber);
    setRegenerateError("");
    regenerateCancelledRef.current = false;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (regenerateCancelledRef.current) return;
      const next = regenerateSingleDayPlan(itinerary, dayNumber, preferences);
      if (!regenerateCancelledRef.current) applyItineraryChange(next);
    } catch (err) {
      if (!regenerateCancelledRef.current) {
        setRegenerateError(err instanceof Error ? err.message : "Could not regenerate day.");
      }
    } finally {
      setRegeneratingDay(null);
    }
  }

  function cancelRegenerate() {
    regenerateCancelledRef.current = true;
    setRegeneratingDay(null);
    setRegenerateError("");
  }

  // Feature 3: Apply budget savings suggestion
function applySavingsSuggestion(suggestion) {
  if (!itinerary) return;

  if (suggestion.actionType === "remove_activity") {
    applyItineraryChange(
      removeLocation(itinerary, suggestion.dayNumber, suggestion.itemId)
    );
  } else if (suggestion.actionType === "switch_transport_scooter") {
    let next = clone(itinerary);

    (suggestion.rides || []).forEach(({ dayNumber, itemId }) => {
      next = updateTransportation(
        next,
        dayNumber,
        itemId,
        "Scooter"
      );
    });

    applyItineraryChange(next);
  } else if (suggestion.actionType === "replace_meal") {
    const day = itinerary.days_plan.find(
      (d) => d.day === suggestion.dayNumber
    );

    if (!day) return;

    const currentMeal = day.items.find(
      (item) => item.id === suggestion.itemId
    );

    if (!currentMeal) return;

    const allCandidates = [
      ...(mockItinerary.extra_activities || []),
      ...(mockItinerary.days_plan || []).flatMap(
        (d) => d.items || []
      ),
    ];

    const replacement = allCandidates.find(
      (candidate) =>
        candidate.type === "restaurant" &&
        candidate.name !== currentMeal.name &&
        Number(candidate.cost || 0) <= 650 &&
        !day.items.some(
          (item) => item.name === candidate.name
        )
    );

    if (!replacement) return;

    const next = clone(itinerary);

    const dayIndex = next.days_plan.findIndex(
      (d) => d.day === suggestion.dayNumber
    );

    if (dayIndex === -1) return;

    const itemIndex = next.days_plan[dayIndex].items.findIndex(
      (item) => item.id === suggestion.itemId
    );

    if (itemIndex === -1) return;

    next.days_plan[dayIndex].items[itemIndex] = {
      ...clone(replacement),
      id: currentMeal.id,
      time: currentMeal.time,
    };

    const recalculated = recalculateItinerary(next);

    applyItineraryChange(recalculated);
  }
}

  // Feature 4: Optimize route for a day
  function optimizeRoute(dayNumber) {
  if (!itinerary) {
    return { valid: false, error: "No itinerary loaded." };
  }

  const day = itinerary.days_plan.find((d) => d.day === dayNumber);

  if (!day) {
    return { valid: false, error: "Day not found." };
  }

  const result = optimizeDayRoute(day);

  if (!result.valid) {
    return result;
  }

  const next = clone(itinerary);
  const dayIndex = next.days_plan.findIndex(
    (d) => d.day === dayNumber
  );

  if (dayIndex === -1) {
    return { valid: false, error: "Day not found." };
  }

  next.days_plan[dayIndex].items = result.items;

  const recalculated = recalculateItinerary(next);

  applyItineraryChange(recalculated);

  return {
    ...result,
    itinerary: recalculated,
  };
}

  async function requestChange(text) {
    if (!text.trim() || isModifying) return;

    const userMessage = { role: "user", text: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsModifying(true);
    setModificationError("");

    try {
      const result = await sendConciergeChat(
        text.trim(),
        selectedStay,
        preferences,
        itinerary,
        1,
        nextMessages
      );

      // Only update local itinerary state if backend indicated an actual modification took place
      let nextItinerary = itinerary;
      if (result.itinerary_modified && result.modified_itinerary) {
        nextItinerary = result.modified_itinerary;
        setItinerary(nextItinerary);
      }

      const updatedMessages = [
        ...nextMessages,
        { role: "assistant", text: result.reply },
      ];
      setMessages(updatedMessages);
      persist({ itinerary: nextItinerary, messages: updatedMessages });
    } catch (error) {
      setModificationError(
        error instanceof Error
          ? error.message
          : "We could not process your request right now. Please try again."
      );
      persist({ messages: nextMessages });
    } finally {
      setIsModifying(false);
    }
  }

   const value = useMemo(
    () => ({
      preferences,
      selectedStay,
      selectStay,
      clearSelectedStay,
      itinerary,
      messages,
      isGenerating,
      isModifying,
      generationError,
      modificationError,
      timeEditError,
      pendingTimeReorder: Boolean(pendingTimeReorder),
      wishlist,
      regeneratingDay,
      regenerateError,
      updatePreferences,
      createItinerary,
      requestChange,
      removeActivity,
      moveActivity,
      editActivityTime,
      confirmTimeReorder,
      cancelTimeReorder,
      changeTransportation,
      addActivity,
      updateTravelers,
      getAddableLocations: (dayNumber) => getAddableLocations(itinerary, dayNumber),
      saveToWishlist,
      removeFromWishlist,
      addWishlistItemToDay,
      regenerateDay,
      cancelRegenerate,
      applySavingsSuggestion,
      optimizeRoute,
    }),
    [
      preferences,
      selectedStay,
      itinerary,
      messages,
      isGenerating,
      isModifying,
      generationError,
      modificationError,
      timeEditError,
      pendingTimeReorder,
      wishlist,
      regeneratingDay,
      regenerateError,
    ]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used inside TripProvider");
  }
  return context;
}