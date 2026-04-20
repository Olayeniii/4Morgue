import { Link } from "react-router-dom"
import type { DeathRecord } from "../types/death"
import { CauseBadge } from "./CauseBadge"
import { EpitaphCard } from "./EpitaphCard"
import { ObituaryToeTag } from "./ObituaryToeTag"
import { cn } from "../lib/utils"
import { formatDate, formatLifespan, formatUsdCompact, shortenAddressClean } from "../lib/ui"

export function DetailPanel({
  token,
  className,
  onClose,
}: {
  token: DeathRecord | null
  className?: string
  onClose?: () => void
}) {
  if (!token) {
    return (
      <div className={cn("flex min-h-[260px] flex-col justify-center rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center", className)}>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text3)]">No Obituary Selected</p>
        <p className="mt-3 font-display text-3xl text-[var(--text2)]">Choose a case from the feed.</p>
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)]", className)}>
      <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={!onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text3)] disabled:cursor-default disabled:opacity-40"
            aria-label="Close detail panel"
          >
            X
          </button>
          <Link to={`/token/${token.address}`} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
            View Obituary
          </Link>
        </div>
        <div className="flex justify-center">
          <ObituaryToeTag token={token} className="w-full max-w-[320px]" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <CauseBadge cause={token.causeOfDeath} />
          <div className="font-mono text-xs text-[var(--text3)]">{formatDate(token.diedAt)} UTC</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 text-sm md:grid-cols-2">
          <div>
            <div className="text-[var(--text3)]">Lifespan</div>
            <div className="mt-1 text-3xl text-[var(--text)]">{formatLifespan(token.lifespanMinutes)}</div>
          </div>
          <div>
            <div className="text-[var(--text3)]">Peak MCAP</div>
            <div className="mt-1 text-3xl text-[var(--text)]">{formatUsdCompact(token.peakMcapUSD)}</div>
          </div>
          <div>
            <div className="text-[var(--text3)]">Final MCAP</div>
            <div className="mt-1 text-3xl text-[var(--text)]">$0.00</div>
          </div>
          <div>
            <div className="text-[var(--text3)]">Buyers</div>
            <div className="mt-1 text-3xl text-[var(--text)]">{token.totalBuyers.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[var(--text3)]">Creator</div>
            <div className="mt-1 text-lg text-[var(--text)]">{shortenAddressClean(token.creatorWallet, 4, 4)}</div>
          </div>
          <div>
            <div className="text-[var(--text3)]">Txs</div>
            <div className="mt-1 text-3xl text-[var(--text)]">{token.totalTrades.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] bg-[var(--bg)] p-5">
          <h3 className="font-medium text-[var(--text)]">Obituary</h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--text2)]">{token.obituary}</p>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-[var(--text)]">Epitaph</h3>
          <EpitaphCard epitaph={token.epitaph || "The docs were beautiful. The code was not."} className="mt-3" />
        </div>

        <div className="mt-5 flex gap-3">
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text2)]">[]</button>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${token.name} - ${token.epitaph || token.obituary.slice(0, 80)}`)}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-[linear-gradient(90deg,var(--accent-indigo),var(--accent-violet))] px-4 py-3 text-center text-sm font-medium text-white">
            Share Obituary
          </a>
        </div>
      </div>
    </div>
  )
}
