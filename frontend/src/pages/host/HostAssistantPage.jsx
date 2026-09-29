import { useState, useRef, useEffect } from "react";
import HostShell from "../../components/host/HostShell.jsx";
import { useHost } from "../../context/HostContext.jsx";
import { Bot, Send, User, Sparkles } from "lucide-react";

export default function HostAssistantPage() {
  const { assistantMessages, sendAssistantChat } = useHost();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const messages = assistantMessages || [
    {
      role: "assistant",
      content: "Hello Host! I am your 24/7 AI Property Assistant. How can I help you optimize your listing, pricing, or guest reviews today?"
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    await sendAssistantChat(userText);
    setLoading(false);
  };

  const sampleQuestions = [
    "How can I increase weekend bookings?",
    "What amenities do GTDC travelers search for?",
    "Suggest a response for a 4-star guest review."
  ];

  return (
    <HostShell>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs">
          <div className="flex items-center gap-2 text-pine mb-1">
            <Bot className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-ink">
              24/7 AI Host Assistant
            </h2>
          </div>
          <p className="text-xs text-ink-muted">
            Ask questions about pricing, listing optimization, local tourism trends, or guest review management.
          </p>
        </div>

        {/* CHAT CONTAINER */}
        <div className="rounded-2xl border border-sand bg-paper p-4 shadow-xs flex flex-col h-[520px]">
          {/* MESSAGES LIST */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isAssistant
                        ? "border border-sand bg-cream/50 text-ink"
                        : "bg-pine text-white"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {!isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-copper/10 text-copper mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-sand bg-cream/50 p-3.5 text-xs text-ink-muted animate-pulse">
                  AI Assistant is thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* SAMPLE QUESTIONS */}
          <div className="my-2 pt-2 border-t border-sand/60 flex flex-wrap gap-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="inline-flex items-center gap-1 rounded-full border border-sand bg-cream/40 px-3 py-1 text-[11px] font-medium text-ink-muted hover:border-pine hover:text-pine transition"
              >
                <Sparkles className="h-3 w-3 text-pine" />
                <span>{q}</span>
              </button>
            ))}
          </div>

          {/* CHAT INPUT */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI Property Assistant..."
              className="flex-1 rounded-full border border-sand bg-cream/30 px-4 py-2 text-xs text-ink placeholder:text-ink-muted/60 focus:border-pine focus:ring-1 focus:ring-pine outline-none transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pine text-white hover:bg-pine/90 disabled:opacity-40 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </HostShell>
  );
}
