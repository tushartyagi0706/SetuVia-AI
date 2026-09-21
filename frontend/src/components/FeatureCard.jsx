export default function FeatureCard({ icon, title, body }) {
  return (
    <article className="rounded-3xl border border-sand bg-cream p-6 shadow-card transition-all duration-300 hover:shadow-lg hover:border-copper/30 sm:p-7">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-copper-light">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
    </article>
  );
}
