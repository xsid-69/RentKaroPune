import Logo from "./Logo";

/**
 * Branded loading indicator. `variant="page"` fills a section for route/Suspense
 * boundaries; `variant="inline"` is a compact spinner for buttons and cards.
 */
export default function Loader({ label = "Loading", variant = "page", className = "" }) {
  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--orange-soft)] border-t-[var(--orange)] motion-reduce:animate-none" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <div className={`grid min-h-[55vh] place-items-center px-4 ${className}`} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-[var(--orange-soft)] border-t-[var(--orange)] motion-reduce:animate-none" />
          <Logo size={26} className="gap-1 [&_[data-logo-word]]:hidden" />
        </span>
        <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--muted)]">{label}…</span>
      </div>
    </div>
  );
}
