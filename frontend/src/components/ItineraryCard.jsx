import { Clock, MapPin, Star, Wallet, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatRupees, itemTypeLabel } from "../utils/format.js";
import { TRANSPORT_MODES } from "../services/itineraryService.js";
import { useTrip } from "../context/TripContext.jsx";

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function timeTo24Hour(value) {
  if (!value) return "09:00";
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const match24 = String(value).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (match24) return `${match24[1].padStart(2, "0")}:${match24[2]}`;
    return "09:00";
  }
  let hour = Number(match[1]);
  const min = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${min}`;
}

function time24To12Hour(value) {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  let hour = Number(match[1]);
  const min = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min} ${suffix}`;
}

const TYPE_STYLES = {
  place: "bg-pine/10 text-pine",
  restaurant: "bg-copper/15 text-copper-dark",
  activity: "bg-sand text-ink",
};

const IMAGE_FALLBACKS = {
  Beaches: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
  ],
};

function getDeterministicFallback(item) {
  const cat = item.category || "";
  const pool = IMAGE_FALLBACKS[cat] || IMAGE_FALLBACKS.default;
  if (!Array.isArray(pool) || pool.length === 0) {
    return typeof pool === "string" ? pool : IMAGE_FALLBACKS.default[0];
  }

  const idPart = item.id || item.item_id || "";
  const namePart = item.name || "";
  const key = idPart && namePart ? `${idPart}_${namePart}` : namePart || idPart;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

function resolveItemImage(item) {
  if (item.image_url && typeof item.image_url === "string" && item.image_url.trim()) {
    return item.image_url.trim();
  }
  if (item.image && typeof item.image === "string" && item.image.trim()) {
    return item.image.trim();
  }
  return getDeterministicFallback(item);
}

export default function ItineraryCard({
  item,
  slot,
  dayNumber,
  index,
  itemCount,
  onRemove,
  onMove,
  onTimeChange,
  onTransportChange,
  timeEditError,
  onConfirmReorder,
  onCancelReorder,
  isSimulatingRain,
}) {
  const { selectedStay, preferences } = useTrip();
  const [imageSource, setImageSource] = useState(() => resolveItemImage(item));
  const [hasFailed, setHasFailed] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [draftTime, setDraftTime] = useState(item.time);

  useEffect(() => {
    setImageSource(resolveItemImage(item));
    setHasFailed(false);
  }, [item]);

  function handleImageError() {
    const defaultFallback = IMAGE_FALLBACKS.default[0];
    if (imageSource !== defaultFallback) {
      setImageSource(defaultFallback);
    } else {
      setHasFailed(true);
    }
  }

  const isOutdoor = /beach|water|nature|adventure|viewpoint|fort|park|outdoor/i.test(
    `${item.category || ""} ${item.name || ""} ${item.description || ""}`
  );

  // Why Recommended Reasons Generator
  const getWhyRecommendedReasons = () => {
    const reasons = [];

    // Backend-provided distance or recommendation reason
    if (item.distance_from_stay_km !== undefined && item.distance_from_stay_km !== null) {
      const stayShort = selectedStay?.stay_name ? selectedStay.stay_name.split(" ")[0] : "stay";
      reasons.push(`✓ ${item.distance_from_stay_km} km from your stay (${stayShort})`);
    } else if (item.recommendation_reason) {
      reasons.push(`✓ ${item.recommendation_reason}`);
    } else {
      const itemLat = item.latitude || item.lat;
      const itemLng = item.longitude || item.lng;
      if (selectedStay && selectedStay.latitude && selectedStay.longitude && itemLat && itemLng) {
        const dist = calculateHaversineKm(selectedStay.latitude, selectedStay.longitude, itemLat, itemLng);
        if (dist !== null) {
          reasons.push(`✓ ${dist} km from your stay`);
        }
      } else if (selectedStay) {
        reasons.push(`✓ Conveniently close to your stay anchor`);
      }
    }

    // Interest Match
    if (preferences?.interests && Array.isArray(preferences.interests)) {
      const catLower = (item.category || "").toLowerCase();
      const match = preferences.interests.find(i => catLower.includes(i.toLowerCase()) || i.toLowerCase().includes(catLower));
      if (match) {
        reasons.push(`✓ Matches your ${match} interest`);
      }
    }

    // Budget Suitability
    if (!item.cost || item.cost === 0 || item.cost <= 300) {
      reasons.push(`✓ Fits your budget`);
    }

    // Pace Suitability
    if (preferences?.travel_pace) {
      reasons.push(`✓ Suitable for your ${preferences.travel_pace} travel pace`);
    }

    return reasons;
  };

  const whyReasons = getWhyRecommendedReasons();

  return (
    <article className="overflow-hidden rounded-3xl border border-sand bg-cream shadow-card">
      <div className="grid md:grid-cols-[minmax(0,200px)_1fr]">
        {imageSource && !hasFailed ? (
          <img
            src={imageSource}
            alt={`${item.name} in ${item.location}`}
            className="h-32 w-full object-cover sm:h-36 md:h-full"
            onError={handleImageError}
          />
        ) : (
          <div className="h-44 bg-sand md:h-full" />
        )}
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">
              {slot}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                TYPE_STYLES[item.type] || TYPE_STYLES.place
              }`}
            >
              {itemTypeLabel(item.type)}
            </span>
            <span className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink-muted">
              {item.category}
            </span>
            {isSimulatingRain && isOutdoor && (
              <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 text-xs font-semibold">
                🌧️ Rain Caution (Outdoor)
              </span>
            )}
          </div>

          <h3 className="mt-2 font-display text-xl text-ink sm:text-2xl">{item.name}</h3>

          {/* WHY RECOMMENDED SECTION */}
          {whyReasons.length > 0 && (
            <div className="mt-2.5 rounded-xl border border-pine/20 bg-pine/5 p-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pine flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-copper" />
                Why Recommended?
              </span>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-ink">
                {whyReasons.map((reason, idx) => (
                  <span key={idx} className="font-medium text-pine/90">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p
            className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted sm:line-clamp-none"
            title={item.description}
          >
            {item.description}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-muted sm:grid-cols-4">
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-paper/70 px-2 py-1.5">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Time and duration: </span>
              <span>
                {item.time} · {item.duration}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-paper/70 px-2 py-1.5">
              <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Cost: </span>
              <span>{item.cost ? formatRupees(item.cost) : "Free"}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-paper/70 px-2 py-1.5">
              <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Rating: </span>
              <span>{item.rating}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-paper/70 px-2 py-1.5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Location: </span>
              <span>{item.location}</span>
            </div>
          </dl>
          {item.transportation && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand/70 pt-3 text-xs text-ink-muted">
              <span className="font-medium text-ink">From previous stop</span>
              <select
                value={item.transportation.mode}
                onChange={(event) => onTransportChange(dayNumber, item.id, event.target.value)}
                className="rounded-lg border border-sand bg-paper px-2 py-1.5 text-xs text-ink outline-none focus:ring-2 focus:ring-pine"
                aria-label={`Transportation to ${item.name}`}
              >
                {Object.keys(TRANSPORT_MODES).map((mode) => <option key={mode}>{mode}</option>)}
              </select>
              <span>{item.transportation.duration} · {formatRupees(item.transportation.estimatedCost)}</span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand/70 pt-3">
            {editingTime ? (
              <>
                <input
                  type="text"
                  inputMode="text"
                  value={draftTime}
                  onChange={(event) => setDraftTime(event.target.value)}
                  placeholder="10:00 AM"
                  className="w-24 rounded-lg border border-sand bg-paper px-2 py-1.5 text-xs"
                  aria-label={`Type new time for ${item.name}`}
                />
                <input
                  type="time"
                  value={timeTo24Hour(draftTime)}
                  onChange={(event) => setDraftTime(time24To12Hour(event.target.value))}
                  className="rounded-lg border border-sand bg-paper px-2 py-1.5 text-xs"
                  aria-label={`New time for ${item.name}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const result = onTimeChange(dayNumber, item.id, draftTime, false);
                    if (!result?.error) setEditingTime(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-base font-semibold text-cream hover:bg-pine-light"
                  aria-label={`Apply time for ${item.name}`}
                  title="Apply time"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const result = onTimeChange(dayNumber, item.id, draftTime, true);
                    if (!result?.error) setEditingTime(false);
                  }}
                  className="rounded-full border border-sand px-3 py-1.5 text-xs font-medium text-copper-dark hover:bg-sand/50"
                >
                  Adjust schedule
                </button>
                {timeEditError && (
                  <div className="basis-full rounded-xl bg-sand/40 p-2 text-xs text-copper-dark">
                    <p>{timeEditError}</p>
                    {timeEditError.includes("changes the order") && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={onConfirmReorder} className="rounded-full bg-ink px-3 py-1.5 font-medium text-cream">Reorder itinerary</button>
                        <button type="button" onClick={onCancelReorder} className="rounded-full border border-sand bg-cream px-3 py-1.5 font-medium text-ink">Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <button type="button" onClick={() => setEditingTime(true)} className="text-xs font-medium text-pine hover:underline">Edit time</button>
            )}
            <button type="button" onClick={() => onMove(dayNumber, item.id, "up")} disabled={index === 0} className="text-xs text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">Move up</button>
            <button type="button" onClick={() => onMove(dayNumber, item.id, "down")} disabled={index === itemCount - 1} className="text-xs text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">Move down</button>
            <button type="button" onClick={() => onRemove(dayNumber, item.id)} className="text-xs font-medium text-copper-dark hover:underline">Remove</button>
          </div>
        </div>
      </div>
    </article>
  );
}
