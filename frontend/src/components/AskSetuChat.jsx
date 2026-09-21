import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  Utensils,
  Wallet,
  CloudSun,
  HelpCircle,
  Check,
  AlertTriangle,
  Compass,
  Building2,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { useTrip } from "../context/TripContext.jsx";

export default function AskSetuChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const location = useLocation();
  const chatEndRef = useRef(null);

  const {
    preferences,
    selectedStay,
    itinerary,
    messages,
    isModifying,
    modificationError,
    requestChange
  } = useTrip();

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isModifying]);

  // Handle opening chat from custom event (e.g. from StayDetailsModal)
  useEffect(() => {
    function handleOpenSetu(e) {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleQuickAction(e.detail.prompt);
      }
    }
    window.addEventListener("open-ask-setu", handleOpenSetu);
    return () => window.removeEventListener("open-ask-setu", handleOpenSetu);
  }, []);

  // Route-aware contextual quick action prompt suggestions
  const getContextualPrompts = () => {
    const isStaysPage = location.pathname.includes("/stays");
    const isItineraryPage = location.pathname.includes("/itinerary");

    if (isStaysPage && selectedStay) {
      return [
        {
          id: "stay-dining",
          label: "🍽️ Find food near this stay",
          prompt: `Find top-rated restaurants near my selected stay: ${selectedStay.stay_name}`
        },
        {
          id: "stay-places",
          label: "📍 Places near this stay",
          prompt: `What are the best attractions near ${selectedStay.stay_name}?`
        },
        {
          id: "stay-explain",
          label: "🔎 Explain stay trust info",
          prompt: `Explain why ${selectedStay.stay_name} is verified by GTDC.`
        },
        {
          id: "stay-price",
          label: "🏨 Stay pricing query",
          prompt: `How much does ${selectedStay.stay_name} cost per night?`
        }
      ];
    }

    if (isItineraryPage && itinerary) {
      return [
        {
          id: "itin-near",
          label: "📍 What's near my stay?",
          prompt: selectedStay
            ? `List places in my itinerary close to ${selectedStay.stay_name}`
            : "List places near my stay"
        },
        {
          id: "itin-food",
          label: "🍽️ Local dining tips",
          prompt: "Recommend dining spots for my current trip schedule"
        },
        {
          id: "itin-budget",
          label: "💰 Check trip budget",
          prompt: "How is my trip budget looking?"
        },
        {
          id: "itin-relax",
          label: "🔄 Make Day 1 more relaxed",
          prompt: "Make Day 1 more relaxed with a lighter schedule"
        },
        {
          id: "itin-why",
          label: "❓ Why these recommendations?",
          prompt: "Why were these places recommended for my stay and preferences?"
        }
      ];
    }

    return [
      {
        id: "gen-welcome",
        label: "📍 Popular Goa spots near stays",
        prompt: "What are popular spots in Goa near verified GTDC stays?"
      },
      {
        id: "gen-budget",
        label: "💰 How does SetuVia budget work?",
        prompt: "Explain how SetuVia calculates dining, activities, and fuel costs."
      },
      {
        id: "gen-stay-price",
        label: "🏨 How much does my stay cost?",
        prompt: "What is the stay price?"
      }
    ];
  };

  const handleQuickAction = async (promptText) => {
    // Intercept stay price queries with strict guardrail answer
    const lower = promptText.toLowerCase();
    if (
      lower.includes("stay cost") ||
      lower.includes("stay price") ||
      lower.includes("cost per night") ||
      (lower.includes("how much") && lower.includes("stay"))
    ) {
      await requestChange("How much does my stay cost?");
      return;
    }

    await requestChange(promptText);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isModifying) return;
    const msg = inputMessage.trim();
    setInputMessage("");

    // Guardrail intercept for stay cost
    const lower = msg.toLowerCase();
    if (
      lower.includes("stay cost") ||
      lower.includes("stay price") ||
      lower.includes("hotel price") ||
      lower.includes("accommodation cost") ||
      (lower.includes("how much") && lower.includes("stay"))
    ) {
      await requestChange("How much does my stay cost?");
      return;
    }

    await requestChange(msg);
  };

  return (
    <>
      {/* FLOATING CHAT BUTTON (BOTTOM-RIGHT) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-pine px-5 py-3 text-sm font-semibold text-cream shadow-2xl transition hover:bg-pine-dark focus:outline-none focus:ring-4 focus:ring-pine/30 active:scale-95"
        aria-label="Ask Setu 24/7 AI Travel Concierge"
      >
        <Sparkles className="h-5 w-5 text-copper" />
        <span className="font-display font-bold">Ask Setu 🤖</span>
      </button>

      {/* BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* CHAT WINDOW DRAWER */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-sand bg-cream shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Ask Setu Chat Window"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-sand bg-paper p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pine/10 text-pine">
              <Sparkles className="h-5 w-5 text-copper" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-1.5">
                Ask Setu 🤖
                <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[10px] font-semibold text-copper-dark uppercase">
                  AI Concierge
                </span>
              </h2>
              <p className="text-xs text-ink-muted">
                {selectedStay ? `Anchored to ${selectedStay.stay_name}` : "24/7 Grounded Travel Assistant"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink hover:bg-sand transition"
            aria-label="Close chat window"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ACTIVE CONTEXT BANNER */}
        <div className="bg-pine/5 px-4 py-2.5 border-b border-sand/60 text-xs text-ink-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-pine shrink-0" />
            <span className="truncate max-w-[220px]">
              {selectedStay ? (
                <>Stay: <strong className="text-ink">{selectedStay.stay_name}</strong></>
              ) : (
                "No Stay Selected"
              )}
            </span>
          </div>
          {itinerary && (
            <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-medium text-ink">
              {itinerary.total_days || itinerary.days_plan?.length || 3} Days Trip
            </span>
          )}
        </div>

        {/* CONTEXTUAL QUICK ACTION PROMPTS */}
        <div className="p-4 border-b border-sand/60 bg-paper/50">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-copper mb-2">
            Suggested Quick Actions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {getContextualPrompts().map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleQuickAction(item.prompt)}
                disabled={isModifying}
                className="rounded-full border border-sand bg-paper px-3 py-1.5 text-xs text-ink hover:bg-sand/60 transition disabled:opacity-50 text-left shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* MESSAGES BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-sand bg-paper p-4 text-center">
              <Compass className="h-8 w-8 text-pine mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-ink">
                Hi! I'm Setu, your AI travel concierge.
              </p>
              <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                How can I help you today? Ask me about places near your stay, budget tips, weather advice, or schedule adjustments.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[88%] ${
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-ink-soft mb-1 px-1">
                {msg.role === "user" ? "You" : "Setu"}
              </span>
              <div
                className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-pine text-cream rounded-tr-none shadow-sm"
                    : "bg-paper border border-sand text-ink rounded-tl-none shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isModifying && (
            <div className="flex items-center gap-2 text-xs text-ink-muted bg-paper p-3 rounded-2xl border border-sand">
              <Sparkles className="h-4 w-4 text-copper animate-spin" />
              <span>Setu is thinking...</span>
            </div>
          )}

          {modificationError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              Sorry, I couldn't process that right now: {modificationError}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT FOOTER */}
        <form onSubmit={handleSend} className="p-4 border-t border-sand bg-paper flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Setu (e.g. Find food near stay)..."
            className="flex-1 rounded-full border border-sand bg-cream px-4 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-pine"
            disabled={isModifying}
          />
          <button
            type="submit"
            disabled={isModifying || !inputMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-copper text-cream transition hover:bg-copper-dark disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
