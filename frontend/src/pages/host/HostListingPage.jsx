import { useState } from "react";
import HostShell from "../../components/host/HostShell.jsx";
import { useHost } from "../../context/HostContext.jsx";
import { Sparkles, Wand2, Copy, Check, Tag } from "lucide-react";

export default function HostListingPage() {
  const { listingDraft, generateListing } = useHost();
  const [prompt, setPrompt] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([
    "River View",
    "Air Conditioning",
    "Free Breakfast"
  ]);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const availableAmenities = [
    "River View",
    "Air Conditioning",
    "Free Breakfast",
    "GTDC Partner Verified",
    "High-speed Wi-Fi",
    "Balcony",
    "Heritage Architecture",
    "Walking distance to beaches"
  ];

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    await generateListing(prompt, selectedAmenities);
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!listingDraft) return;
    const text = `${listingDraft.generated_title}\n\n${listingDraft.generated_summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <HostShell>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="rounded-2xl border border-sand bg-paper p-5 shadow-xs">
          <div className="flex items-center gap-2 text-pine mb-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-ink">
              AI Listing Studio
            </h2>
          </div>
          <p className="text-xs text-ink-muted">
            Craft high-converting titles and descriptions powered by SetuVia AI. Optimized for GTDC travelers, digital nomads, and culture seekers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INPUT FORM */}
          <form
            onSubmit={handleGenerate}
            className="rounded-2xl border border-sand bg-paper p-5 shadow-xs space-y-4"
          >
            <h3 className="font-display text-sm font-bold text-ink">
              Listing Parameters
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Special Highlights / Key Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Near Mandovi river, newly renovated Portuguese heritage building, quiet courtyard, great for families..."
                rows={3}
                className="w-full rounded-xl border border-sand bg-cream/30 p-3 text-xs text-ink placeholder:text-ink-muted/60 focus:border-pine focus:ring-1 focus:ring-pine outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-2">
                Select Key Amenities to Highlight
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableAmenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition ${
                        isSelected
                          ? "bg-pine text-white"
                          : "border border-sand bg-cream/50 text-ink hover:bg-sand"
                      }`}
                    >
                      <Tag className="h-3 w-3" />
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-pine py-2.5 px-4 text-xs font-semibold text-white shadow-xs hover:bg-pine/90 disabled:opacity-50 transition"
            >
              <Wand2 className="h-4 w-4" />
              <span>{generating ? "Generating AI Listing..." : "Generate Listing"}</span>
            </button>
          </form>

          {/* AI OUTPUT */}
          <div className="rounded-2xl border border-sand bg-paper p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pine" />
                  <span>Generated Listing Preview</span>
                </h3>

                {listingDraft && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs text-pine font-medium hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-pine" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {listingDraft ? (
                <div className="space-y-3 rounded-xl border border-sand/80 bg-cream/40 p-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-muted">Suggested Title</span>
                    <h4 className="font-display text-base font-bold text-ink mt-0.5">
                      {listingDraft.generated_title}
                    </h4>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-muted">Property Description</span>
                    <p className="text-xs text-ink leading-relaxed mt-1">
                      {listingDraft.generated_summary}
                    </p>
                  </div>

                  {listingDraft.highlighted_amenities?.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ink-muted">Highlighted Features</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {listingDraft.highlighted_amenities.map((item, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-pine/10 px-2 py-0.5 text-[10px] font-semibold text-pine"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-sand p-8 text-center text-xs text-ink-muted">
                  Fill in the parameters on the left and click "Generate Listing" to create your AI-enhanced description.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HostShell>
  );
}
