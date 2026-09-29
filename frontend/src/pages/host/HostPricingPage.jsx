import HostShell from "../../components/host/HostShell.jsx";
import { HostLoadingState, HostErrorState } from "../../components/host/HostStates.jsx";
import { useHost } from "../../context/HostContext.jsx";
import { Sparkles, TrendingUp, CheckCircle, PlusCircle, IndianRupee } from "lucide-react";

export default function HostPricingPage() {
  const { pricingData, loading, error, fetchPricing, applyPricingSuggestion } = useHost();

  if (loading && !pricingData) {
    return (
      <HostShell>
        <HostLoadingState message="Calculating AI Dynamic Pricing Insights..." />
      </HostShell>
    );
  }

  if (error && !pricingData) {
    return (
      <HostShell>
        <HostErrorState message={error} onRetry={fetchPricing} />
      </HostShell>
    );
  }

  const data = pricingData || {
    current_base_rate_inr: 3200,
    recommended_base_rate_inr: 3650,
    market_demand_level: "High (Goa Season Peak)",
    insights: [
      {
        id: "sug-1",
        title: "Weekend Surge Pricing (+15%)",
        description: "Demand peaks on Friday & Saturday nights due to cruise tourism and weekend travelers.",
        impact: "+₹450 / night",
        applied: false
      },
      {
        id: "sug-2",
        title: "Extended Stay Discount (-10% for 5+ nights)",
        description: "Encourage longer stays to reduce turnover maintenance costs.",
        impact: "Higher Occupancy",
        applied: true
      }
    ]
  };

  return (
    <HostShell>
      <div className="space-y-6">
        {/* HEADER SUMMARY */}
        <div className="rounded-2xl border border-sand bg-paper p-5 shadow-xs">
          <div className="flex items-center gap-2 text-pine mb-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-ink">
              AI Dynamic Pricing & Insights
            </h2>
          </div>
          <p className="text-xs text-ink-muted">
            Data-backed rate recommendations based on local GTDC demand trends, upcoming festivals, and competitor occupancy in North Goa.
          </p>
        </div>

        {/* RATES OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
            <span className="text-xs font-semibold text-ink-muted">Current Base Rate</span>
            <div className="mt-2 flex items-baseline gap-1 text-2xl font-bold font-display text-ink">
              <IndianRupee className="h-5 w-5 text-ink-muted" />
              <span>{data.current_base_rate_inr}</span>
              <span className="text-xs text-ink-muted font-normal">/ night</span>
            </div>
          </div>

          <div className="rounded-2xl border border-pine/30 bg-pine/5 p-4 shadow-xs">
            <span className="text-xs font-semibold text-pine flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Recommended Base Rate
            </span>
            <div className="mt-2 flex items-baseline gap-1 text-2xl font-bold font-display text-pine">
              <IndianRupee className="h-5 w-5 text-pine" />
              <span>{data.recommended_base_rate_inr}</span>
              <span className="text-xs text-pine/80 font-normal">/ night</span>
            </div>
            <p className="mt-1 text-[11px] text-pine">
              +₹{data.recommended_base_rate_inr - data.current_base_rate_inr} potential gain
            </p>
          </div>

          <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
            <span className="text-xs font-semibold text-ink-muted">Market Demand Level</span>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-copper" />
              <span className="text-base font-bold font-display text-ink">
                {data.market_demand_level}
              </span>
            </div>
          </div>
        </div>

        {/* INSIGHTS & SUGGESTIONS */}
        <div className="rounded-2xl border border-sand bg-paper p-5 shadow-xs space-y-4">
          <h3 className="font-display text-sm font-bold text-ink">
            Smart Pricing Adjustments
          </h3>

          <div className="space-y-3">
            {data.insights.map((insight) => (
              <div
                key={insight.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
                  insight.applied
                    ? "border-pine/30 bg-pine/5"
                    : "border-sand bg-cream/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink">{insight.title}</span>
                    <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[10px] font-bold text-copper">
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                <button
                  onClick={() => applyPricingSuggestion(insight.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition ${
                    insight.applied
                      ? "bg-pine text-white hover:bg-pine/90"
                      : "border border-sand bg-paper text-ink hover:bg-sand"
                  }`}
                >
                  {insight.applied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Applied</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>Apply Suggestion</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HostShell>
  );
}
