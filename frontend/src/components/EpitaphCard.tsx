import { cn } from "../lib/utils"

export function EpitaphCard({ epitaph, className }: { epitaph: string; className?: string }) {
  return (
    <blockquote className={cn("rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4", className)}>
      <p className="font-display text-[1.55rem] italic leading-tight text-[var(--accent-violet)]">{epitaph}</p>
      <footer className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text3)]">FourMorgue epitaph</footer>
    </blockquote>
  )
}
