const STEPS = [
  {
    n: "01",
    title: "Tell us how you travel",
    body: "Share your destination, travel style, interests, and preferences to help us understand your perfect trip.",
  },
  {
    n: "02",
    title: "We understand your preferences",
    body: "SETUVIA analyzes your choices to create a journey that matches your pace, budget, and travel personality.",
  },
  {
    n: "03",
    title: "Get your personalized journey",
    body: "Receive a complete day-by-day itinerary tailored specifically to how you want to experience your destination.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-copper">How SETUVIA works</p>
      <h2 className="mt-3 max-w-xl font-display text-3xl text-ink sm:text-4xl">
        Your personalized journey in three simple steps
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="rounded-3xl bg-ink px-6 py-7 text-cream">
            <p className="text-xs tracking-[0.24em] text-copper-light">{step.n}</p>
            <h3 className="mt-4 font-display text-2xl">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-sand">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
