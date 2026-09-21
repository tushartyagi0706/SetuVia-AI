import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStays } from "../services/stayService.js";
import { useTrip } from "../context/TripContext.jsx";
import StayCard from "../components/StayCard.jsx";
import StayDetailsModal from "../components/StayDetailsModal.jsx";
import { Building2, Search, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export default function StayDiscoveryPage() {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModalStay, setActiveModalStay] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const { selectStay } = useTrip();
  const navigate = useNavigate();

  const fetchStaysData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStays();
      setStays(data);
    } catch (err) {
      setError(err.message || "Failed to load verified stays. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaysData();
  }, []);

  const handleSelectStay = (stay) => {
    selectStay(stay);
    navigate("/plan");
  };

  // Filter stays by search query & stay_type
  const stayTypes = ["All", ...new Set(stays.map((s) => s.stay_type).filter(Boolean))];

  const filteredStays = stays.filter((stay) => {
    const matchesSearch =
      !searchQuery ||
      stay.stay_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stay.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stay.district?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || stay.stay_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* HEADER SECTION */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-pine/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-pine mb-4">
          <ShieldCheck className="h-4 w-4" />
          <span>Verified Accommodations</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
          Find a Stay You Can Trust
        </h1>
        <p className="mt-4 text-base text-ink-muted">
          Browse verified stays in Goa. Select your base accommodation, and SETUVIA will build your personalized trip itinerary around it.
        </p>
      </div>

      {/* CONTROLS: SEARCH & FILTER */}
      <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-sand bg-paper/60 p-4 sm:p-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by stay name or area..."
            className="w-full rounded-2xl border-0 bg-cream pl-11 pr-4 py-3 text-sm text-ink ring-1 ring-sand outline-none focus:ring-2 focus:ring-pine"
          />
        </div>

        {/* TYPE FILTER PILLS */}
        <div className="flex w-full md:w-auto items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {stayTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition shrink-0 ${
                selectedType === type
                  ? "bg-pine text-cream font-semibold shadow-sm"
                  : "bg-cream border border-sand text-ink hover:bg-sand/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-pine mb-4" />
          <p className="text-sm font-medium text-ink-muted">Loading verified stays from MongoDB...</p>
        </div>
      ) : error ? (
        <div className="mt-12 rounded-3xl border border-copper/30 bg-copper/10 p-8 text-center max-w-xl mx-auto">
          <AlertCircle className="h-10 w-10 text-copper-dark mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-ink">Stay Discovery Unavailable</h3>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <button
            type="button"
            onClick={fetchStaysData}
            className="mt-6 rounded-full bg-copper px-6 py-2.5 text-xs font-semibold text-cream hover:bg-copper-dark transition"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredStays.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-sand bg-cream/50 p-12 text-center max-w-md mx-auto">
          <Building2 className="h-12 w-12 text-ink-soft mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-ink">No Stays Found</h3>
          <p className="mt-1 text-sm text-ink-muted">Try adjusting your search query or type filter.</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStays.map((stay) => (
            <StayCard
              key={stay.stay_id}
              stay={stay}
              onSelect={handleSelectStay}
              onViewDetails={(s) => setActiveModalStay(s)}
            />
          ))}
        </div>
      )}

      {/* STAY DETAILS MODAL */}
      {activeModalStay && (
        <StayDetailsModal
          stay={activeModalStay}
          onClose={() => setActiveModalStay(null)}
          onSelect={handleSelectStay}
        />
      )}
    </div>
  );
}
