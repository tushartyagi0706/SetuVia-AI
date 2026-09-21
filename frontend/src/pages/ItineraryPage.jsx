import BudgetInsights from "../components/BudgetInsights.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import DaySelector from "../components/DaySelector.jsx";
import ItineraryCard from "../components/ItineraryCard.jsx";
import ModificationChat from "../components/ModificationChat.jsx";
import TripSummary from "../components/TripSummary.jsx";
import WeatherBadge from "../components/WeatherBadge.jsx";
import { useTrip } from "../context/TripContext.jsx";
import { formatTripDate } from "../utils/format.js";

function slotForIndex(index, total) {
  if (total <= 1) return "Day";
  if (index === 0) return "Morning";
  if (index === total - 1) return "Evening";
  if (index === 1 && total === 3) return "Afternoon";
  if (index < total / 2) return "Late morning";
  return "Afternoon";
}

export default function ItineraryPage() {
  const {
    itinerary,
    selectedStay,
    removeActivity,
    moveActivity,
    editActivityTime,
    changeTransportation,
    addActivity,
    getAddableLocations,
    timeEditError,
    confirmTimeReorder,
    cancelTimeReorder,
    updateTravelers,
    regenerateDay,
    regeneratingDay,
  } = useTrip();
  const [activeDay, setActiveDay] = useState(1);
  const [isSimulatingRain, setIsSimulatingRain] = useState(false);

  const activeStay = selectedStay || itinerary?.selected_stay || itinerary?.selectedStay;

  const day = useMemo(
    () => itinerary?.days_plan.find((entry) => entry.day === activeDay),
    [itinerary, activeDay]
  );

  function handleDayChange(nextDay) {
    setActiveDay(nextDay);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  useEffect(() => {
    if (!itinerary?.days_plan.some((entry) => entry.day === activeDay)) {
      setActiveDay(itinerary?.days_plan[0]?.day || 1);
    }
  }, [itinerary, activeDay]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeDay]);

  if (!itinerary) {
    return <Navigate to="/plan" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-copper">
              AI itinerary
            </p>
            <WeatherBadge city={itinerary.destination || "Goa"} />
            <button
              type="button"
              onClick={() => setIsSimulatingRain(!isSimulatingRain)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition flex items-center gap-1.5 ${
                isSimulatingRain
                  ? "bg-blue-900 text-blue-100 border border-blue-700 shadow-sm"
                  : "bg-paper text-ink border border-sand hover:bg-cream"
              }`}
            >
              {isSimulatingRain ? "🌧️ Heavy Rain Active (DEMO)" : "🌧️ Simulate Rain (DEMO)"}
            </button>
          </div>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-5xl">
            {itinerary.headline}
          </h1>

          {activeStay && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-pine/30 bg-pine/5 px-4 py-1.5 text-xs text-pine font-medium">
              <span className="font-semibold">Your Stay:</span>
              <span>{activeStay.stay_name || activeStay.name}</span>
              {(activeStay.area || activeStay.district) && (
                <span className="text-pine/70">({activeStay.area ? `${activeStay.area}, ${activeStay.district || "Goa"}` : activeStay.district})</span>
              )}
            </div>
          )}
        </div>
        <Link
          to="/plan"
          className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Edit preferences
        </Link>
      </div>

      {isSimulatingRain && (
        <div className="mt-4 rounded-2xl border border-blue-300 bg-blue-50/90 p-4 text-xs text-blue-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold flex items-center gap-1.5 text-sm text-blue-950">
              ⛈️ Weather Alert: High probability of heavy rainfall today! (DEMO Mode)
            </p>
            <p className="mt-1 text-blue-800">
              Outdoor beaches & water sports may experience closures. Recommended indoor database POIs: <strong>Museum of Christian Art</strong>, <strong>Houses of Goa Museum</strong>, or <strong>Big Foot Goa</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSimulatingRain(false)}
            className="self-start sm:self-center shrink-0 rounded-lg bg-blue-200/80 px-3 py-1 font-semibold text-blue-900 hover:bg-blue-300"
          >
            Turn Off
          </button>
        </div>
      )}

      <div className="mt-8 lg:hidden">
        <TripSummary itinerary={itinerary} compact onTravelersChange={updateTravelers} />
      </div>
      <div className="mt-6 lg:hidden">
        <BudgetInsights itinerary={itinerary} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <DaySelector
            days={itinerary.days_plan}
            activeDay={activeDay}
            onChange={handleDayChange}
          />
          {day && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-ink">
                    Day {day.day} · {day.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {formatTripDate(day.date, { year: undefined })} · {day.theme}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => regenerateDay(day.day)}
                  disabled={regeneratingDay === day.day}
                  className="inline-flex items-center gap-2 rounded-xl border border-pine/30 bg-pine/10 px-3.5 py-2 text-xs font-semibold text-pine transition hover:bg-pine/20 disabled:opacity-50"
                >
                  {regeneratingDay === day.day ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-pine border-t-transparent" />
                      <span>Regenerating Day {day.day}...</span>
                    </>
                  ) : (
                    <>
                      <span>Regenerate Day {day.day}</span>
                      <span className="text-sm">🔄</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {day.items.map((item, index) => (
                  <ItineraryCard
                    key={item.id}
                    item={item}
                    slot={slotForIndex(index, day.items.length)}
                    dayNumber={day.day}
                    index={index}
                    itemCount={day.items.length}
                    onRemove={removeActivity}
                    onMove={moveActivity}
                    onTimeChange={editActivityTime}
                    onTransportChange={changeTransportation}
                    timeEditError={timeEditError}
                    onConfirmReorder={confirmTimeReorder}
                    onCancelReorder={cancelTimeReorder}
                    isSimulatingRain={isSimulatingRain}
                  />
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-sand bg-cream p-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-ink sm:flex-row sm:items-center">
                  Add a verified location to Day {day.day}
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const location = getAddableLocations(day.day).find((entry) => entry.name === event.target.value);
                      if (location) event.target.value = "";
                      if (location) addActivity(day.day, location);
                    }}
                    className="rounded-xl border border-sand bg-paper px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-pine"
                    aria-label={`Add location to day ${day.day}`}
                  >
                    <option value="">Add a verified location to Day {day.day}</option>
                    {getAddableLocations(day.day).map((location) => <option key={location.name}>{location.name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          )}
          <div className="mt-8">
            <ModificationChat />
          </div>
        </div>
        <div className="hidden lg:flex lg:flex-col lg:gap-6">
          <TripSummary
            itinerary={itinerary}
            onTravelersChange={updateTravelers}
          />
          <BudgetInsights itinerary={itinerary} />
        </div>
      </div>
    </div>
  );
}
  

