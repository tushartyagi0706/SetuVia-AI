export default function Footer() {
  return (
    <footer className="border-t border-sand bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-2xl tracking-[0.16em]">SETUVIA</p>
          <p className="mt-2 max-w-sm text-sm text-sand">
            AI-powered travel concierge creating personalized journeys
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-copper-light">
          © 2026 SETUVIA
        </p>
      </div>
    </footer>
  );
}
