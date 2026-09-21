import React from "react";
import { Building2, MapPin, Star, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function StayCard({ stay, onSelect, onViewDetails }) {
  if (!stay) return null;

  const {
    stay_id,
    stay_name,
    stay_type,
    area,
    district,
    rating,
    review_count,
    image_url,
    data_source,
    data_quality_flag
  } = stay;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-sand bg-paper p-5 transition-all duration-300 hover:-translate-y-1 hover:border-pine/40 hover:shadow-xl">
      <div>
        {/* IMAGE / THUMBNAIL */}
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-cream">
          {image_url ? (
            <img
              src={image_url}
              alt={stay_name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand/40 to-pine/10 text-pine"
            style={{ display: image_url ? "none" : "flex" }}
          >
            <Building2 className="h-12 w-12 opacity-60" />
          </div>

          {/* STAY TYPE BADGE */}
          <div className="absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] font-semibold tracking-wider text-cream uppercase backdrop-blur-md">
            {stay_type || "Stay"}
          </div>

          {/* VERIFIED BADGE */}
          {data_quality_flag && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-pine px-2.5 py-1 text-[10px] font-medium text-cream shadow-md">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* TITLE & AREA */}
        <h3 className="font-display text-xl font-bold text-ink group-hover:text-pine">
          {stay_name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="h-3.5 w-3.5 text-copper shrink-0" />
          <span>{area ? `${area}, ${district || "Goa"}` : district || "Goa"}</span>
        </div>

        {/* RATING & REVIEWS */}
        <div className="mt-3 flex items-center gap-3 text-xs">
          {rating && rating > 0 ? (
            <div className="flex items-center gap-1 font-semibold text-ink">
              <Star className="h-4 w-4 fill-copper text-copper" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : null}

          {review_count && review_count > 0 ? (
            <span className="text-ink-soft">({review_count} reviews)</span>
          ) : null}

          {data_source ? (
            <span className="ml-auto rounded-md bg-cream px-2 py-0.5 text-[10px] font-medium text-ink-muted border border-sand">
              {data_source}
            </span>
          ) : null}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex items-center gap-2 border-t border-sand/60 pt-4">
        <button
          type="button"
          onClick={() => onViewDetails(stay)}
          className="flex-1 rounded-xl border border-sand bg-cream py-2.5 text-xs font-semibold text-ink transition hover:bg-sand/60 hover:text-black"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onSelect(stay)}
          className="flex-1 rounded-xl bg-pine py-2.5 text-xs font-semibold text-cream transition hover:bg-pine-dark shadow-sm"
        >
          Select Stay
        </button>
      </div>
    </div>
  );
}
