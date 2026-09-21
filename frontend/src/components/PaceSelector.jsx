import { PACE_OPTIONS } from "../constants/options.js";
import { Check } from "lucide-react";

export default function PaceSelector({ value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">What's your travel pace?</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PACE_OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={`relative rounded-2xl border px-4 py-4 text-left transition ${
                active
                    ? "border-pine bg-pine text-cream shadow-card ring-2 ring-copper/50 ring-offset-2 ring-offset-paper"
                    : "border-sand bg-cream text-ink hover:bg-sand/50"
              }`}
            >
                {active && (
                  <Check
                    className="absolute right-4 top-4 h-4 w-4 text-copper-light"
                    aria-hidden="true"
                  />
                )}
              <span className="block font-medium">{option.label}</span>
              <span
                className={`mt-1 block text-sm ${
                  active ? "text-sand" : "text-ink-soft"
                }`}
              >
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
