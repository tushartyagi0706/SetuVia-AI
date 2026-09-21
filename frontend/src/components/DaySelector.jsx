import { Check } from "lucide-react";

export default function DaySelector({ days, activeDay, onChange }) {
  return (
    <div
      className="sticky top-[5.75rem] z-20 flex gap-2 overflow-x-auto bg-paper/95 py-2 backdrop-blur-sm scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:top-[4.5rem]"
      aria-label="Itinerary days"
      role="tablist"
    >
      {days.map((day) => {
        const active = day.day === activeDay;
        return (
          <button
            key={day.day}
            type="button"
            onClick={() => onChange(day.day)}
            role="tab"
            aria-selected={active}
            aria-label={`View day ${day.day}`}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-ink bg-ink text-cream ring-2 ring-copper/60 ring-offset-2 ring-offset-paper"
                : "border-sand bg-cream text-ink hover:bg-sand/60"
            }`}
          >
            {active && <Check className="h-4 w-4" aria-hidden="true" />}
            Day {day.day}
          </button>
        );
      })}
    </div>
  );
}
