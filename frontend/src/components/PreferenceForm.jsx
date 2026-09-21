import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FOOD_OPTIONS, PACE_OPTIONS } from "../constants/options.js";
import { useTrip } from "../context/TripContext.jsx";
import { formatRupees } from "../utils/format.js";
import { formatTripDate, tripDateRange, tripEndDate } from "../utils/format.js";
import InterestSelector from "./InterestSelector.jsx";
import PaceSelector from "./PaceSelector.jsx";

function validate(form) {
  const errors = {};
  if (!form.destination.trim() || form.destination.trim().length < 2) {
    errors.destination = "Please enter a destination.";
  }
  if (!Number.isInteger(Number(form.days)) || form.days < 1 || form.days > 14) {
    errors.days = "Please choose between 1 and 14 days.";
  }
  if (!Number.isFinite(Number(form.budget)) || form.budget <= 0) {
    errors.budget = "Please enter a positive budget.";
  }
  if (!form.startDate) errors.startDate = "Please choose a trip start date.";
  if (!Number.isInteger(Number(form.travelers)) || form.travelers < 1 || form.travelers > 15) {
    errors.travelers = "Please choose between 1 and 15 travelers.";
  }
  if (!form.interests.length) {
    errors.interests = "Please select at least one interest.";
  }
  if (!form.pace) {
    errors.pace = "Please choose a travel pace.";
  }
  if (!form.food_preference) {
    errors.food_preference = "Please choose a food preference.";
  }
  return errors;
}

export default function PreferenceForm() {
  const { preferences, updatePreferences, selectedStay, clearSelectedStay } = useTrip();
  const [form, setForm] = useState(preferences);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function patch(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    updatePreferences({ ...form, endDate: tripEndDate(form.startDate, form.days) });
    navigate("/generating");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Where are you going?</span>
          <input
            value={form.destination}
            onChange={(event) => patch({ destination: event.target.value })}
            className="mt-2 w-full rounded-2xl border-0 bg-cream px-4 py-3.5 text-ink ring-1 ring-sand outline-none focus:ring-2 focus:ring-pine"
            placeholder="Goa"
          />
          {errors.destination && (
            <p className="mt-2 text-sm text-copper-dark">{errors.destination}</p>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">How many days?</span>
          <div className="mt-2 flex items-center justify-center gap-4 rounded-2xl bg-cream px-4 py-3 ring-1 ring-sand">
            <button
              type="button"
              onClick={() => patch({ days: Math.max(1, form.days - 1) })}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream hover:bg-pine transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={form.days <= 1}
            >
              −
            </button>
            <span className="w-20 text-center text-sm font-medium">
              {form.days} {form.days === 1 ? "day" : "days"}
            </span>
            <button
              type="button"
              onClick={() => patch({ days: Math.min(14, form.days + 1) })}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream hover:bg-pine transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={form.days >= 14}
            >
              +
            </button>
          </div>
          {errors.days && (
            <p className="mt-2 text-sm text-copper-dark">{errors.days}</p>
          )}
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink">What's your budget?</span>
        <div className="mt-2 rounded-2xl bg-cream px-4 py-4 ring-1 ring-sand">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">Indian Rupees</span>
            <span className="font-medium">{formatRupees(form.budget)}</span>
          </div>
          <input
            type="number"
            min="1"
            step="1"
            value={form.budget}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                patch({ budget: "" });
                return;
              }
              const normalized = raw.replace(/^0+(?=\d)/, "");
              patch({ budget: Number(normalized) });
            }}
            className="mt-3 w-full rounded-xl border-0 bg-paper px-3 py-2 text-ink ring-1 ring-sand outline-none focus:ring-2 focus:ring-pine"
          />
        </div>
        {errors.budget && (
          <p className="mt-2 text-sm text-copper-dark">{errors.budget}</p>
        )}
      </label>

      <div>
        <span className="text-sm font-medium text-ink">Who's coming along?</span>
        <div className="mt-2 flex items-center justify-center gap-5 rounded-2xl bg-cream px-4 py-3 ring-1 ring-sand">
          <button
            type="button"
            onClick={() => patch({ travelers: Math.max(1, form.travelers - 1) })}
            disabled={form.travelers <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Decrease travelers"
          >−</button>
          <span className="min-w-24 text-center text-sm font-medium">
            {form.travelers} {form.travelers === 1 ? "traveler" : "travelers"}
          </span>
          <button
            type="button"
            onClick={() => patch({ travelers: Math.min(15, form.travelers + 1) })}
            disabled={form.travelers >= 15}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Increase travelers"
          >+</button>
        </div>
        {errors.travelers && <p className="mt-2 text-sm text-copper-dark">{errors.travelers}</p>}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink">When does your trip start?</span>
        <input
          type="date"
          value={form.startDate || ""}
          min="2026-01-01"
          onChange={(event) => patch({ startDate: event.target.value })}
          className="mt-2 w-full rounded-2xl border-0 bg-cream px-4 py-3.5 text-ink ring-1 ring-sand outline-none focus:ring-2 focus:ring-pine"
        />
        <p className="mt-2 text-sm text-ink-muted">
          {form.startDate && tripDateRange(form.startDate, form.days)}
        </p>
        {errors.startDate && <p className="mt-2 text-sm text-copper-dark">{errors.startDate}</p>}
      </label>

      <div>
        <InterestSelector
          selected={form.interests}
          onChange={(interests) => patch({ interests })}
        />
        {errors.interests && (
          <p className="mt-2 text-sm text-copper-dark">{errors.interests}</p>
        )}
      </div>

      <div>
        <PaceSelector value={form.pace} onChange={(pace) => patch({ pace })} />
        {errors.pace && (
          <p className="mt-2 text-sm text-copper-dark">{errors.pace}</p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-ink">Any food preference?</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FOOD_OPTIONS.map((option) => {
            const active = form.food_preference === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => patch({ food_preference: option })}
                aria-pressed={active}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm transition ${
                  active
                    ? "border-ink bg-ink text-cream ring-2 ring-copper/50 ring-offset-2 ring-offset-paper"
                    : "border-sand bg-cream text-ink hover:bg-sand/50"
                }`}
              >
                {active && <Check className="h-4 w-4" aria-hidden="true" />}
                {option}
              </button>
            );
          })}
        </div>
        {errors.food_preference && (
          <p className="mt-2 text-sm text-copper-dark">{errors.food_preference}</p>
        )}
      </div>

      {/* SELECTED STAY CARD (PHASE 2) */}
      <div className="rounded-2xl border border-pine/30 bg-pine/5 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-pine font-semibold">Your Selected Stay</p>
          <button
            type="button"
            onClick={() => navigate("/stays")}
            className="text-xs font-semibold text-copper hover:text-copper-dark underline"
          >
            {selectedStay ? "Change Stay" : "+ Discover Stays"}
          </button>
        </div>

        {selectedStay ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-display text-lg font-bold text-ink">{selectedStay.stay_name}</h4>
              <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                <span>{selectedStay.stay_type}</span>
                <span>·</span>
                <span>{selectedStay.area ? `${selectedStay.area}, ${selectedStay.district || "Goa"}` : selectedStay.district}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelectedStay}
              className="text-xs text-copper hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-ink-muted">
            No stay selected yet. <button type="button" onClick={() => navigate("/stays")} className="text-pine font-medium underline">Select a verified stay</button> to center your trip itinerary around your accommodation.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-sand bg-cream p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-copper">Your trip summary</p>
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Destination</span>
            <span className="font-medium text-ink">{form.destination}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Duration</span>
            <span className="font-medium text-ink">{form.days} {form.days === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Dates</span>
            <span className="font-medium text-ink">{form.startDate && tripDateRange(form.startDate, form.days)}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Travelers</span>
            <span className="font-medium text-ink">{form.travelers}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Budget</span>
            <span className="font-medium text-ink">{formatRupees(form.budget)}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-sm">
            <span className="text-ink-soft">Interests</span>
            <span className="font-medium text-ink sm:text-right">{form.interests.join(' · ')}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Pace</span>
            <span className="font-medium text-ink">{form.pace}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-ink-soft">Food</span>
            <span className="font-medium text-ink">{form.food_preference}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-full bg-copper py-4 text-sm font-semibold text-cream transition hover:bg-copper-dark sm:w-auto sm:px-10"
      >
        Generate My Trip
      </button>
    </form>
  );
}
