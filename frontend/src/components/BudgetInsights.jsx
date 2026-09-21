import { useMemo, useState } from "react";
import { calculateBudgetInsights } from "../services/tripInsightsService.js";
import { useTrip } from "../context/TripContext.jsx";
import { Info, Sparkles, AlertTriangle } from "lucide-react";

export default function BudgetInsights({ itinerary }) {
  const { applySavingsSuggestion } = useTrip();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const insights = useMemo(
    () => calculateBudgetInsights(itinerary),
    [itinerary]
  );

  if (!insights) return null;

  const handleAutoOptimize = () => {
    if (!insights.suggestions?.length) return;
    setIsOptimizing(true);
    const topSuggestion = insights.suggestions.find(s => s.actionType) || insights.suggestions[0];
    if (topSuggestion && topSuggestion.actionType) {
      applySavingsSuggestion(topSuggestion);
    }
    setTimeout(() => setIsOptimizing(false), 500);
  };

  return (
    <section className="mt-6 rounded-2xl border border-sand bg-paper p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            Transparent Budget Ledger
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Trip Budget Breakdown
          </h2>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            insights.isOverBudget
              ? "bg-red-50 text-red-700 font-bold border border-red-200"
              : "bg-green-50 text-green-700 font-bold border border-green-200"
          }`}
        >
          {insights.isOverBudget ? "⚠️ Over budget" : "✓ On track"}
        </span>
      </div>

      {/* OVER BUDGET WARNING BANNER */}
      {insights.isOverBudget && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>Over-Budget Warning: Your planned expenses exceed your budget cap. Use Auto-Optimize Budget below to adjust costs.</span>
        </div>
      )}

      {/* STAY COST EXCLUSION NOTICE */}
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-pine/5 border border-pine/20 px-3.5 py-2 text-xs text-pine font-medium">
        <Info className="h-4 w-4 shrink-0" />
        <span>Stay pricing is excluded from trip budget. Ledger covers Dining + Activities + Transport.</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div className="rounded-xl bg-cream p-3">
          <p className="text-xs text-ink-muted">Total Budget</p>
          <p className="mt-1 text-base sm:text-lg font-bold text-ink">
            {insights.budget}
          </p>
        </div>

        <div className="rounded-xl bg-cream p-3">
          <p className="text-xs text-ink-muted">Planned Cost</p>
          <p className="mt-1 text-base sm:text-lg font-bold text-ink">
            {insights.totalCost}
          </p>
        </div>

        <div className="rounded-xl bg-cream p-3">
          <p className="text-xs text-ink-muted">Remaining</p>
          <p className={`mt-1 text-base sm:text-lg font-bold ${insights.isOverBudget ? "text-red-600" : "text-pine"}`}>
            {insights.remaining || "₹0"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        {insights.statusText}
      </p>

      {/* ITEMIZED BREAKDOWN */}
      <div className="mt-5">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-ink">
          Expense Breakdown
        </h3>

        <div className="mt-2.5 space-y-2 border-t border-sand/60 pt-2.5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>🏨 Stay / Accommodation</span>
            <span className="font-semibold text-pine">₹0 (Excluded)</span>
          </div>

          {insights.contributors?.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs text-ink"
            >
              <span>{item.label}</span>
              <span className="font-medium">{item.amount}</span>
            </div>
          ))}

          <div className="flex items-center justify-between text-xs font-bold text-ink border-t border-sand/60 pt-2">
            <span>💰 Total Planned Cost</span>
            <span>{insights.totalCost}</span>
          </div>
        </div>
      </div>

      {/* AUTO-OPTIMIZE BUDGET BUTTON */}
      <div className="mt-5 border-t border-sand/60 pt-4">
        <button
          type="button"
          onClick={handleAutoOptimize}
          disabled={isOptimizing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-4 py-2.5 text-xs font-semibold text-cream hover:bg-copper-dark transition shadow-sm disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-cream" />
          <span>{isOptimizing ? "Optimizing Budget..." : "Auto-Optimize Budget"}</span>
        </button>
      </div>

      {insights.suggestions?.length > 0 && (
        <div className="mt-4 space-y-2">
          {insights.suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.actionType}-${index}`}
              className="rounded-xl border border-sand bg-cream p-3 text-xs"
            >
              <p className="text-ink">{suggestion.text}</p>
              {suggestion.savings > 0 && (
                <p className="mt-1 font-semibold text-pine">
                  Save {suggestion.savings}
                </p>
              )}
              {suggestion.actionType && (
                <button
                  type="button"
                  onClick={() => applySavingsSuggestion(suggestion)}
                  className="mt-2 rounded-lg bg-ink px-3 py-1.5 text-[11px] font-medium text-paper hover:opacity-90"
                >
                  Apply Suggestion
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}