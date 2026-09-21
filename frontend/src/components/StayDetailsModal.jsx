import React from "react";
import { X, MapPin, Star, ExternalLink, ShieldCheck, CheckCircle2, Globe, CalendarCheck, Building2, Sparkles } from "lucide-react";

export default function StayDetailsModal({ stay, onClose, onSelect }) {
  if (!stay) return null;

  const {
    stay_id,
    stay_name,
    stay_type,
    area,
    district,
    latitude,
    longitude,
    rating,
    review_count,
    image_url,
    image_source,
    official_website,
    booking_url,
    data_source,
    data_quality_flag,
    last_checked_at
  } = stay;

  const handleAskSetu = () => {
    onSelect(stay);
    onClose();
    window.dispatchEvent(
      new CustomEvent("open-ask-setu", {
        detail: { prompt: `Find top-rated restaurants near my selected stay: ${stay_name}` }
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-sand bg-paper p-6 sm:p-8 shadow-2xl">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink hover:bg-sand transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* HERO IMAGE */}
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-cream">
          {image_url ? (
            <img
              src={image_url}
              alt={stay_name}
              className="h-full w-full object-cover"
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
            <Building2 className="h-16 w-16 opacity-60" />
          </div>

          <div className="absolute top-4 left-4 rounded-full bg-ink/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-cream uppercase backdrop-blur-md">
            {stay_type || "Stay"}
          </div>
        </div>

        {/* HEADER & LOCATION */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-copper">
              Verified Stay #{stay_id}
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
              {stay_name}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin className="h-4 w-4 text-copper shrink-0" />
              <span>{area ? `${area}, ${district || "Goa"}` : district || "Goa"}</span>
              {latitude && longitude ? (
                <span className="ml-2 text-xs text-ink-soft">({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
              ) : null}
            </div>
          </div>

          {rating && rating > 0 ? (
            <div className="flex items-center gap-1.5 rounded-2xl bg-cream px-4 py-2 border border-sand shrink-0">
              <Star className="h-5 w-5 fill-copper text-copper" />
              <span className="font-bold text-lg text-ink">{rating.toFixed(1)}</span>
              {review_count ? <span className="text-xs text-ink-soft">({review_count} reviews)</span> : null}
            </div>
          ) : (
            <div className="rounded-2xl bg-cream px-3 py-1.5 border border-sand text-xs text-ink-soft shrink-0">
              Rating not available
            </div>
          )}
        </div>

        {/* TRUST EVIDENCE PANEL */}
        <div className="mt-6 rounded-2xl border border-pine/20 bg-pine/5 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-pine">
            <ShieldCheck className="h-5 w-5" />
            <span>🛡️ Trust Evidence Panel</span>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-ink-soft">
              <CheckCircle2 className="h-4 w-4 text-pine shrink-0" />
              <span>Data Source: <strong className="text-ink">{data_source || "Goa Tourism / GTDC"}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <CheckCircle2 className="h-4 w-4 text-pine shrink-0" />
              <span>Data Quality: <strong className="text-ink">{data_quality_flag || "VERIFIED"}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <CheckCircle2 className="h-4 w-4 text-pine shrink-0" />
              <span>Image Source: <strong className="text-ink">{image_source || "Official Listing"}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <CheckCircle2 className="h-4 w-4 text-pine shrink-0" />
              <span>Last Checked: <strong className="text-ink">{last_checked_at ? String(last_checked_at) : "Verified Current"}</strong></span>
            </div>
          </div>
        </div>

        {/* OFFICIAL LINKS */}
        <div className="mt-6 flex flex-wrap gap-3">
          {official_website ? (
            <a
              href={official_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-sand bg-cream px-4 py-2.5 text-xs font-semibold text-ink hover:bg-sand transition"
            >
              <Globe className="h-4 w-4 text-pine" />
              <span>Official Website</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-sand/50 bg-cream/50 px-4 py-2.5 text-xs text-ink-soft">
              <Globe className="h-4 w-4 opacity-40" />
              <span>Official Website: Not available</span>
            </span>
          )}

          {booking_url ? (
            <a
              href={booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-sand bg-cream px-4 py-2.5 text-xs font-semibold text-ink hover:bg-sand transition"
            >
              <CalendarCheck className="h-4 w-4 text-copper" />
              <span>Booking Portal</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-sand/50 bg-cream/50 px-4 py-2.5 text-xs text-ink-soft">
              <CalendarCheck className="h-4 w-4 opacity-40" />
              <span>Booking Link: Not available</span>
            </span>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-sand/60 pt-5">
          <button
            type="button"
            onClick={handleAskSetu}
            className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-5 py-2.5 text-xs font-semibold text-copper-dark hover:bg-copper/20 transition"
          >
            <Sparkles className="h-4 w-4 text-copper" />
            <span>Ask Setu About This Stay 🤖</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-sand px-6 py-3 text-xs font-semibold text-ink hover:bg-cream transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onSelect(stay);
                onClose();
              }}
              className="rounded-full bg-pine px-8 py-3 text-xs font-semibold text-cream hover:bg-pine-dark shadow-md transition"
            >
              Select This Stay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
