import { Compass, MessageCircle, Timer, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import FeatureCard from "../components/FeatureCard.jsx";
import Hero from "../components/Hero.jsx";
import HowItWorks from "../components/HowItWorks.jsx";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          Why travelers choose SETUVIA
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Timer className="h-5 w-5" />}
            title="Personalized"
            body="Every itinerary is crafted around your unique preferences, from pace and budget to the specific experiences you value most."
          />
          <FeatureCard
            icon={<Compass className="h-5 w-5" />}
            title="Intelligent"
            body="AI-powered planning that understands your travel style and suggests activities, restaurants, and places that truly match your interests."
          />
          <FeatureCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Effortless"
            body="No more hours of research and planning. Simply share your preferences and get a complete, ready-to-go itinerary in minutes."
          />
        </div>
      </section>
      <section className="border-t border-sand bg-cream py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Ready to plan your perfect trip?
          </h2>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            Start planning your personalized journey with SETUVIA today.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/plan"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-copper px-8 py-4 text-sm font-semibold text-cream transition hover:bg-copper-dark"
            >
              Plan My Trip
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
