import type { DeathRecord } from "../types/death"
import { CauseBadge } from "./CauseBadge"
import { cn } from "../lib/utils"
import { formatDate, formatLifespan, formatUsdCompact } from "../lib/ui"

export function ObituaryToeTag({
  token,
  className,
}: {
  token: DeathRecord
  className?: string
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden border px-5 py-4 shadow-[var(--shadow)]",
        className
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.16), transparent 55%), var(--paper)",
        borderColor: "var(--paper-edge)",
        clipPath: "polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(142,36,72,0.08),transparent_50%)]" />
      <div className="absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-[var(--paper-edge)]" />
      <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border bg-[var(--bg)]" style={{ borderColor: "var(--paper-edge)" }} />
      <div className="absolute right-0 top-1/2 h-px w-6 -translate-y-1/2 bg-[var(--paper-edge)]" />
      <div className="absolute left-8 top-3 right-8 h-px bg-[linear-gradient(90deg,rgba(42,36,31,0.12),transparent)]" />
      <div className="absolute left-8 bottom-3 right-8 h-px bg-[linear-gradient(90deg,transparent,rgba(42,36,31,0.12))]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--paper-subtle)" }}>
              {token.symbol}
            </div>
            <h3 className="mt-1.5 font-display text-[1.35rem] leading-none" style={{ color: "var(--paper-ink)" }}>
              {token.name}
            </h3>
          </div>
        </div>

        <div className="mt-2.5">
          <CauseBadge cause={token.causeOfDeath} className="px-2 py-0.5 text-[9px]" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div style={{ color: "var(--paper-subtle)" }}>Lifespan</div>
            <div className="mt-1" style={{ color: "var(--paper-ink)" }}>{formatLifespan(token.lifespanMinutes)}</div>
          </div>
          <div>
            <div style={{ color: "var(--paper-subtle)" }}>Peak MCAP</div>
            <div className="mt-1" style={{ color: "var(--paper-ink)" }}>{formatUsdCompact(token.peakMcapUSD)}</div>
          </div>
          <div>
            <div style={{ color: "var(--paper-subtle)" }}>Died</div>
            <div className="mt-1" style={{ color: "var(--paper-ink)" }}>{formatDate(token.diedAt)} UTC</div>
          </div>
        </div>

        <p className="mt-3 font-display text-[1.05rem] italic leading-tight text-[var(--accent-violet)]">
          {token.epitaph || "Born a token. Died a dream."}
        </p>
      </div>
    </article>
  )
}
