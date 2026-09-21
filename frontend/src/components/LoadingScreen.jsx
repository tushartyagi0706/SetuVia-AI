import { LOADING_STEPS } from "../services/itineraryService.js";

export default function LoadingScreen({
  stepIndex,
  destination,
  error = "",
  onRetry,
  onBack,
}) {
  const progress = ((stepIndex + 1) / LOADING_STEPS.length) * 100;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className={`relative h-20 w-20 ${error ? "opacity-60" : ""}`}>
        <span className="absolute inset-0 rounded-full border border-sand" />
        <span
          className={`absolute inset-2 rounded-full border-2 border-transparent border-t-copper ${
            error ? "" : "animate-spin"
          }`}
        />
        <span className="absolute inset-5 rounded-full bg-copper/20" />
      </div>
      <p className="mt-8 text-xs uppercase tracking-[0.32em] text-copper">
        SETUVIA is composing
      </p>
      {!error && destination && (
        <p className="mt-3 text-sm text-ink-muted">
          Creating your personalized {destination} itinerary...
        </p>
      )}
      <h1 className="mt-4 max-w-md font-display text-3xl text-ink sm:text-4xl">
        {error || LOADING_STEPS[stepIndex]}
      </h1>
      {!error && (
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-ink-soft">
          Step {stepIndex + 1} of {LOADING_STEPS.length}
        </p>
      )}
      {error && (
        <>
          <p className="mt-3 max-w-md text-sm text-copper-dark">
            We could not finish your itinerary. You can try again or adjust your preferences.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-copper px-5 py-3 text-sm font-semibold text-cream transition hover:bg-copper-dark"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-sand bg-cream px-5 py-3 text-sm font-semibold text-ink transition hover:bg-sand/50"
            >
              Edit preferences
            </button>
          </div>
        </>
      )}
      <div className="mt-8 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-pine transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
