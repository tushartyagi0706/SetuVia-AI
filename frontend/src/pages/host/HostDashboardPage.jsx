import HostShell from "../../components/host/HostShell.jsx";
import { HostLoadingState, HostErrorState } from "../../components/host/HostStates.jsx";
import { useHost } from "../../context/HostContext.jsx";
import { TrendingUp, Users, Wallet, Star, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function HostDashboardPage() {
  const { dashboardData, loading, error, fetchDashboard } = useHost();

  if (loading && !dashboardData) {
    return (
      <HostShell>
        <HostLoadingState message="Loading Host Overview..." />
      </HostShell>
    );
  }

  if (error && !dashboardData) {
    return (
      <HostShell>
        <HostErrorState message={error} onRetry={fetchDashboard} />
      </HostShell>
    );
  }

  const data = dashboardData || {
    property_name: "Panaji Residency (GTDC Partner)",
    total_bookings_this_month: 28,
    occupancy_rate_percent: 82,
    estimated_revenue_inr: 124000,
    trust_score: 4.8,
    verified_status: "GTDC Verified Partner",
    recommendations: [
      "Increase weekend rate by 12% for upcoming festival season",
      "Add 'High-speed Wi-Fi' tag to boost remote worker bookings",
      "Highlight proximity to Panaji Promenade in listing description"
    ]
  };

  return (
    <HostShell>
      <div className="space-y-6">
        {/* PROPERTY TITLE BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-sand bg-paper p-5 shadow-xs">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              {data.property_name}
            </h2>
            <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-4 w-4 text-pine" />
              <span>Status: <strong className="text-pine font-semibold">{data.verified_status}</strong></span>
            </p>
          </div>
          <Link
            to="/host/property"
            className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-cream px-4 py-2 text-xs font-semibold text-ink hover:bg-sand transition self-start sm:self-auto"
          >
            <span>Manage Property</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold">Bookings (This Month)</span>
              <Users className="h-4 w-4 text-copper" />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-ink">
              {data.total_bookings_this_month}
            </p>
            <span className="text-[10px] text-pine font-medium">+14% vs last month</span>
          </div>

          <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold">Occupancy Rate</span>
              <TrendingUp className="h-4 w-4 text-pine" />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-ink">
              {data.occupancy_rate_percent}%
            </p>
            <span className="text-[10px] text-pine font-medium">Optimal performance</span>
          </div>

          <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold">Est. Monthly Revenue</span>
              <Wallet className="h-4 w-4 text-copper" />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-ink">
              ₹{data.estimated_revenue_inr.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-ink-muted">Excludes cleaning fees</span>
          </div>

          <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-xs font-semibold">Guest Rating</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold font-display text-ink">
              {data.trust_score} / 5.0
            </p>
            <span className="text-[10px] text-pine font-medium">Verified by GTDC</span>
          </div>
        </div>

        {/* AI GROWTH RECOMMENDATIONS */}
        <div className="rounded-2xl border border-sand bg-paper p-5 shadow-xs">
          <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2 mb-3">
            <span>✨ AI Growth Recommendations for Your Listing</span>
          </h3>
          <div className="space-y-2.5">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-sand/80 bg-cream/60 p-3 text-xs text-ink"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine/10 text-pine font-bold text-[11px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HostShell>
  );
}
