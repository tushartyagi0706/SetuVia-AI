import { formatInterests, formatRupees, tripDateRange } from "../utils/format.js";

export default function TripSummary({ itinerary, compact = false, onTravelersChange }) {
  if (!itinerary) return null;

  return (
    <aside className="rounded-3xl bg-ink p-6 text-cream">
      <p className="text-xs uppercase tracking-[0.28em] text-copper-light">
        Trip summary
      </p>
      <h2 className="mt-3 font-display text-4xl uppercase tracking-wide">
        {itinerary.destination}
      </h2>
      <p className="mt-2 text-sand">
        {itinerary.days} {itinerary.days === 1 ? "Day" : "Days"} · {itinerary.travelers || 2} {itinerary.travelers === 1 ? "traveler" : "travelers"}
      </p>
      {onTravelersChange && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-ink-muted/40 px-3 py-2 text-sm">
          <span>Travelers</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onTravelersChange((itinerary.travelers || 2) - 1)} disabled={(itinerary.travelers || 2) <= 1} className="flex h-7 w-7 items-center justify-center rounded-full bg-cream text-ink disabled:opacity-40" aria-label="Decrease travelers">−</button>
            <span className="min-w-5 text-center">{itinerary.travelers || 2}</span>
            <button type="button" onClick={() => onTravelersChange((itinerary.travelers || 2) + 1)} disabled={(itinerary.travelers || 2) >= 15} className="flex h-7 w-7 items-center justify-center rounded-full bg-cream text-ink disabled:opacity-40" aria-label="Increase travelers">+</button>
          </div>
        </div>
      )}
      <p className="mt-1 text-sm text-sand">
        {tripDateRange(itinerary.startDate, itinerary.days)}
      </p>
      <div className="mt-6 space-y-3 text-sm">
        <p>{formatInterests(itinerary.interests)}</p>
        <p>
          {itinerary.pace} · {itinerary.food_preference}
        </p>
        <p className="border-t border-ink-muted/40 pt-3 text-sand">
          Planned around {formatRupees(itinerary.budget)}
        </p>
        <div className="space-y-1 border-t border-ink-muted/40 pt-3">
          <p>Activities <span className="float-right">{formatRupees(itinerary.cost_breakdown?.activities || 0)}</span></p>
          <p>Food <span className="float-right">{formatRupees(itinerary.cost_breakdown?.food || 0)}</span></p>
          <p>Transportation <span className="float-right">{formatRupees(itinerary.cost_breakdown?.transportation || 0)}</span></p>
          <p className="pt-2 font-semibold text-cream">Estimated total <span className="float-right">{formatRupees(itinerary.estimated_cost)} </span></p>
          <p className="text-copper-light">Estimated per person <span className="float-right">{formatRupees(itinerary.estimated_per_person || itinerary.estimated_cost / (itinerary.travelers || 2))}</span></p>
        </div>
      </div>
    </aside>
  );
}
