import { useState, useEffect } from "react";
import HostShell from "../../components/host/HostShell.jsx";
import { HostLoadingState, HostErrorState } from "../../components/host/HostStates.jsx";
import { useHost } from "../../context/HostContext.jsx";
import { ShieldCheck, Edit3, Save, CheckCircle } from "lucide-react";

export default function HostPropertyPage() {
  const { propertyData, loading, error, fetchProperty, saveProperty } = useHost();
  const [formData, setFormData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProperty().then((res) => {
      if (res?.editable_data) setFormData(res.editable_data);
    });
  }, []);

  if (loading && !propertyData) {
    return (
      <HostShell>
        <HostLoadingState message="Loading Property Details..." />
      </HostShell>
    );
  }

  if (error && !propertyData) {
    return (
      <HostShell>
        <HostErrorState message={error} onRetry={fetchProperty} />
      </HostShell>
    );
  }

  const prop = propertyData || {
    property_name: "Panaji Residency",
    area: "Panaji",
    district: "North Goa",
    verified_data: {
      data_source: "Goa Tourism / GTDC",
      data_quality_flag: "VERIFIED",
      rating: 4.2,
      review_count: 1036,
      official_website: "https://goa-tourism.com/stay/panaji-residency/"
    }
  };

  const currentForm = formData || {
    tagline: "Heritage riverfront stay in the heart of Panaji",
    description: "Overlooking the Mandovi river, Panaji Residency offers comfortable accommodation with easy access to Latin Quarter walks.",
    amenities: ["Air Conditioning", "Free Breakfast", "River View", "Parking"],
    house_rules: ["Check-in: 12:00 PM", "Check-out: 11:00 AM"]
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await saveProperty({
        ...prop,
        editable_data: currentForm
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { /* noop */ }
  }

  return (
    <HostShell>
      <div className="space-y-6">
        {/* READ-ONLY VERIFIED DATA PANEL */}
        <div className="rounded-2xl border border-pine/30 bg-pine/5 p-5">
          <h3 className="font-display text-sm font-bold text-pine flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-pine shrink-0" />
            <span>Official Verified Property Records (Read-Only)</span>
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            These fields are verified directly from Goa Tourism / GTDC partner records and cannot be altered manually.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-ink-muted block">Property Name</span>
              <strong className="text-ink text-sm">{prop.property_name}</strong>
            </div>
            <div>
              <span className="text-ink-muted block">Location</span>
              <strong className="text-ink text-sm">{prop.area}, {prop.district}</strong>
            </div>
            <div>
              <span className="text-ink-muted block">Data Source</span>
              <strong className="text-pine font-semibold text-sm">{prop.verified_data?.data_source}</strong>
            </div>
            <div>
              <span className="text-ink-muted block">Verified Rating</span>
              <strong className="text-ink text-sm">{prop.verified_data?.rating} ⭐ ({prop.verified_data?.review_count} reviews)</strong>
            </div>
          </div>
        </div>

        {/* HOST-EDITABLE FORM */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-sand bg-paper p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-sand pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-copper" />
                <span>Host-Editable Listing Content</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Update public tagline, guest description, amenities, and house rules.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2 text-xs font-bold text-cream hover:bg-pine-dark transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Property information updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Property Tagline</label>
            <input
              type="text"
              value={currentForm.tagline}
              onChange={(e) => setFormData({ ...currentForm, tagline: e.target.value })}
              className="w-full rounded-xl border border-sand bg-cream px-4 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-pine"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Guest Description</label>
            <textarea
              rows={4}
              value={currentForm.description}
              onChange={(e) => setFormData({ ...currentForm, description: e.target.value })}
              className="w-full rounded-xl border border-sand bg-cream px-4 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-pine"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Amenities (Comma-separated)</label>
            <input
              type="text"
              value={Array.isArray(currentForm.amenities) ? currentForm.amenities.join(", ") : currentForm.amenities}
              onChange={(e) => setFormData({ ...currentForm, amenities: e.target.value.split(",").map(s => s.trim()) })}
              className="w-full rounded-xl border border-sand bg-cream px-4 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-pine"
            />
          </div>
        </form>
      </div>
    </HostShell>
  );
}
