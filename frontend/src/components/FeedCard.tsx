import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import type { DeathRecord } from "../types/death"
import { BnbMark } from "./BnbMark"
import { CauseBadge } from "./CauseBadge"
import { cn } from "../lib/utils"
import { formatLifespan, formatMcapCompact, formatTimeAgo, getCauseMeta, getMcapLabel, shortenAddressClean } from "../lib/ui"

export function FeedCard({
  token,
  active,
  index,
  onSelect,
}: {
  token: DeathRecord
  active: boolean
  index: number
  onSelect: () => void
}) {
  const meta = getCauseMeta(token.causeOfDeath)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.28) }}
      className={cn(
        "group relative w-full max-w-[640px] cursor-pointer overflow-hidden border px-6 py-4 transition-all duration-200",
        active
          ? "border-[var(--accent-violet)]"
          : "hover:border-[var(--paper-edge)]"
      )}
      style={{
        boxShadow: active ? "0 0 0 1px rgba(142,36,72,0.22), var(--shadow)" : "var(--shadow)",
        background:
          `linear-gradient(90deg, ${meta.tint}, transparent 54%), linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%), var(--paper)`,
        borderColor: active ? "var(--accent-violet)" : "var(--paper-edge)",
        clipPath: "polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)",
      }}
      onClick={onSelect}
    >
      <div className="absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-[var(--paper-edge)]" />
      <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border bg-[var(--bg)]" style={{ borderColor: "var(--paper-edge)" }} />
      <div className="absolute right-0 top-1/2 h-px w-6 -translate-y-1/2 bg-[var(--paper-edge)]" />
      <div className="absolute left-8 top-3 right-8 h-px bg-[linear-gradient(90deg,rgba(42,36,31,0.12),transparent)]" />
      <div className="absolute left-8 bottom-3 right-8 h-px bg-[linear-gradient(90deg,transparent,rgba(42,36,31,0.12))]" />

      <div className="relative min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--paper-subtle)" }}>
              {token.symbol}
            </div>
            <h3 className="mt-1.5 truncate font-display text-[1.6rem] leading-none" style={{ color: "var(--paper-ink)" }}>
              {token.name}
            </h3>
          </div>
          <div className="shrink-0 text-[11px]" style={{ color: "var(--paper-subtle)" }}>{formatTimeAgo(token.diedAt)}</div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CauseBadge cause={token.causeOfDeath} className="px-2 py-0.5 text-[9px]" />
          <span className="font-mono text-[10px]" style={{ color: "var(--paper-subtle)" }}>{shortenAddressClean(token.address ?? "", 4, 4)}</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-x-4 gap-y-2 text-[11px]">
          <div>
            <div className="font-mono uppercase tracking-[0.14em]" style={{ color: "var(--paper-subtle)" }}>Lifespan</div>
            <div className="mt-0.5 text-base" style={{ color: "var(--paper-ink)" }}>{formatLifespan(token.lifespanMinutes)}</div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-[0.14em]" style={{ color: "var(--paper-subtle)" }}>{getMcapLabel(token.peakMcapCurrency)}</div>
            <div className="mt-0.5 flex items-center gap-1 text-base" style={{ color: "var(--paper-ink)" }}>
              {token.peakMcapCurrency === "BNB" ? <BnbMark className="h-3.5 w-3.5" /> : null}
              <span>{formatMcapCompact(token.peakMcapUSD, token.peakMcapCurrency)}</span>
            </div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-[0.14em]" style={{ color: "var(--paper-subtle)" }}>Buyers</div>
            <div className="mt-0.5 text-base" style={{ color: "var(--paper-ink)" }}>{token.totalBuyers.toLocaleString()}</div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-[0.14em]" style={{ color: "var(--paper-subtle)" }}>Creator</div>
            <div className="mt-0.5" style={{ color: "var(--paper-ink)" }}>{shortenAddressClean(token.creatorWallet ?? "")}</div>
          </div>
        </div>

        <p className="mt-4 max-w-[34rem] font-display text-[1rem] italic leading-tight" style={{ color: "var(--paper-subtle)" }}>
        "{token.epitaph || token.obituary?.slice(0, 72) || ''}"
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: meta.accent }}>
            {meta.label}
          </div>
          <Link
            to={`/token/${token.address ?? ''}`}
            className="rounded-xl border px-3 py-1.5 text-xs transition-colors"
            style={{ borderColor: "var(--paper-edge)", color: "var(--paper-ink)" }}
            onClick={(event) => event.stopPropagation()}
          >
            View Obituary
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
