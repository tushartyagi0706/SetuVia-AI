import { INTERESTS } from "../constants/options.js";
import { Check } from "lucide-react";

export default function InterestSelector({ selected, onChange }) {
  function toggle(interest) {
    if (selected.includes(interest)) {
      onChange(selected.filter((item) => item !== interest));
    } else {
      onChange([...selected, interest]);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">What are you interested in?</p>
      <p className="mt-1 text-sm text-ink-soft">Select multiple interests that appeal to you.</p>
      <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
        {INTERESTS.map((interest) => {
          const active = selected.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition sm:px-5 ${
                active
                  ? "border-ink bg-ink text-cream ring-2 ring-copper/50 ring-offset-2 ring-offset-paper"
                  : "border-sand bg-cream text-ink hover:bg-sand/60"
              }`}
            >
              {active && <Check className="h-4 w-4" aria-hidden="true" />}
              {interest}
            </button>
          );
        })}
      </div>
    </div>
  );
}
