import PreferenceForm from "../components/PreferenceForm.jsx";

export default function PreferencesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-copper">
        Trip preferences
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
        Let's plan your Goa journey.
      </h1>
      <p className="mt-3 max-w-xl text-ink-muted">
        Tell us what you love, and SETUVIA will build a personalized Goa itinerary around you.
      </p>
      <div className="mt-10 rounded-3xl border border-sand bg-paper/60 p-5 sm:p-8">
        <PreferenceForm />
      </div>
    </div>
  );
}
