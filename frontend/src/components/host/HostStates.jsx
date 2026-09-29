import { Loader2, AlertCircle, WifiOff, Inbox } from "lucide-react";

export function HostLoadingState({ message = "Loading Host Data..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="h-8 w-8 text-pine animate-spin mb-3" />
      <p className="text-sm font-semibold text-ink">{message}</p>
      <p className="text-xs text-ink-muted mt-1">Fetching live property metrics & insights...</p>
    </div>
  );
}

export function HostErrorState({ message = "Failed to load host information", onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center text-red-800">
      <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
      <h4 className="font-bold text-sm">Something went wrong</h4>
      <p className="text-xs mt-1 text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
        >
          Retry Request
        </button>
      )}
    </div>
  );
}

export function HostApiNotConnectedState() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center text-amber-900">
      <WifiOff className="h-8 w-8 text-amber-600 mx-auto mb-2" />
      <h4 className="font-bold text-sm">API Integration Notice</h4>
      <p className="text-xs mt-1 text-amber-800 leading-relaxed max-w-md mx-auto">
        Live host backend endpoints are currently operating in demo fallback mode. Real database metrics will load when connected to live backend host services.
      </p>
    </div>
  );
}

export function HostEmptyState({ title = "No Data Found", description = "No items available to show." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-sand bg-cream/50 p-6">
      <Inbox className="h-8 w-8 text-ink-muted mb-2 opacity-60" />
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-xs text-ink-muted mt-1">{description}</p>
    </div>
  );
}
