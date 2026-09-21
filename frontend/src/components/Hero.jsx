import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
    alt: "Colorful architecture",
    fallback: "https://images.unsplash.com/photo-1584738766473-61c083514bf4?auto=format&fit=crop&w=900&q=80",
    className: "h-48 sm:h-64 lg:h-[22rem]",
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80",
    alt: "Beautiful beach coastline",
    fallback: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=700&q=80",
    className: "h-40 sm:h-52 lg:h-64 mt-8",
  },
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80",
    alt: "Elegant dining experience",
    fallback: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=700&q=80",
    className: "h-36 sm:h-44 lg:h-56",
  },
];

function ImageWithFallback({ src, alt, fallback, className }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imgSrc !== fallback) {
      setImgSrc(fallback);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grain opacity-[0.12]" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-24 lg:pt-10">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-copper">
            AI-POWERED GOA TRIP CONCIERGE
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.12] text-ink sm:text-5xl lg:text-6xl">
            Your journey. Your way.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            SETUVIA shapes your Goa days around your interests, budget, pace, and the way you want to experience the coast.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/plan"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-copper px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-copper-dark"
            >
              Plan My Trip
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-ink-soft sm:ml-2">
              Start planning your perfect trip
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <ImageWithFallback
            src={IMAGES[0].src}
            alt={IMAGES[0].alt}
            fallback={IMAGES[0].fallback}
            className={`${IMAGES[0].className} w-full rounded-3xl object-cover shadow-card`}
          />
          <div className="flex flex-col gap-3 sm:gap-4">
            <ImageWithFallback
              src={IMAGES[1].src}
              alt={IMAGES[1].alt}
              fallback={IMAGES[1].fallback}
              className={`${IMAGES[1].className} w-full rounded-3xl object-cover shadow-card`}
            />
            <ImageWithFallback
              src={IMAGES[2].src}
              alt={IMAGES[2].alt}
              fallback={IMAGES[2].fallback}
              className={`${IMAGES[2].className} w-full rounded-3xl object-cover shadow-card`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
