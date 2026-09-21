import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { SUGGESTED_PROMPTS } from "../constants/options.js";
import { useTrip } from "../context/TripContext.jsx";

export default function ModificationChat() {
  const { messages, requestChange, isModifying, modificationError } = useTrip();
  const [draft, setDraft] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isModifying]);

  async function submit(text) {
    const value = (text ?? draft).trim();
    if (!value || isModifying) return;
    setDraft("");
    await requestChange(value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit();
  }

  return (
    <section className="rounded-3xl border border-sand bg-cream p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-copper">
        Modify with SETUVIA
      </p>
      <h2 className="mt-2 font-display text-2xl text-ink">
        Ask for a different shape of day.
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submit(prompt)}
            disabled={isModifying}
            className="min-h-10 rounded-full bg-paper px-3 py-2 text-left text-sm text-ink ring-1 ring-sand transition hover:bg-sand/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div
        ref={messagesRef}
        className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-sm text-ink-soft">
            Try a sentence like “Make Day 2 more relaxed”. This preview uses a
            mock reply, not a live model.
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto bg-ink text-cream"
                : "bg-paper text-ink"
            }`}
          >
            <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] opacity-70">
              {message.role === "user" ? "You" : "SETUVIA"}
            </span>
            {message.text}
          </div>
        ))}
        {isModifying && (
          <p className="text-sm text-ink-soft">SETUVIA is adjusting the plan…</p>
        )}
        {modificationError && (
          <p className="text-sm text-copper-dark">{modificationError}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="modify-input">
          Modification request
        </label>
        <input
          id="modify-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Make Day 2 more relaxed"
          className="min-h-12 flex-1 rounded-full bg-paper px-4 text-sm outline-none ring-1 ring-sand focus:ring-2 focus:ring-pine"
        />
        <button
          type="submit"
          disabled={isModifying || !draft.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-copper text-cream transition hover:bg-copper-dark disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
