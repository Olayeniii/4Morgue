import { Link } from "react-router-dom"
import type { DeathRecord } from "../types/death"
import { BnbMark } from "./BnbMark"
import { CauseBadge } from "./CauseBadge"
import { EpitaphCard } from "./EpitaphCard"
import { ObituaryToeTag } from "./ObituaryToeTag"
import { cn } from "../lib/utils"
import { formatDate, formatFinalMcap, formatLifespan, formatMcapCompact, getMcapLabel, shortenAddressClean } from "../lib/ui"

export function DetailPanel({
  token,
  className,
  onClose,
  variant = "drawer",
}: {
  token: DeathRecord | null
  className?: string
  onClose?: () => void
  variant?: "drawer" | "page"
}) {
  if (!token) {
    return (
      <div className={cn("flex min-h-[260px] flex-col justify-center rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center", className)}>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text3)]">No Obituary Selected</p>
        <p className="mt-3 font-display text-3xl text-[var(--text2)]">Choose a case from the feed.</p>
      </div>
    )
  }

  const isPage = variant === "page"

  return (
    <div className={cn(
      "overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)]",
      isPage ? "mx-auto max-w-[680px]" : "",
      className
    )}>
      <div className={cn(
        "border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]",
        isPage ? "px-4 py-5" : "p-4"
      )}>
        <div className="mb-4 flex items-center justify-between gap-3">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text3)]"
              aria-label="Close detail panel"
            >
              X
            </button>
          ) : (
            <div />
          )}
          {!isPage ? (
            <Link to={`/token/${token.address}`} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
              View Obituary
            </Link>
          ) : null}
        </div>
        <div className="flex justify-center">
          <ObituaryToeTag
            token={token}
            className={cn(
              "w-full",
              isPage ? "max-w-[520px] px-5 py-4" : "max-w-[320px]"
            )}
          />
        </div>
      </div>

      <div className={cn(isPage ? "mx-auto w-full max-w-[520px] p-4" : "p-5")}>
        <div className="flex items-center justify-between gap-3">
          <CauseBadge cause={token.causeOfDeath} />
          <div className="font-mono text-xs text-[var(--text3)]">{formatDate(token.diedAt)} UTC</div>
        </div>

        <div className={cn(
          "mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 text-sm md:grid-cols-2",
          isPage ? "gap-x-5 gap-y-5" : ""
        )}>
          <div>
            <div className="text-[var(--text3)]">Lifespan</div>
            <div className="mt-1 text-3xl text-[var(--text)]">{formatLifespan(token.lifespanMinutes)}</div>
          </div>
          <div>
            <div className="text-[var(--text3)]">{getMcapLabel(token.peakMcapCurrency)}</div>
            <div className="mt-1 flex items-center gap-2 text-3xl text-[var(--text)]">
              {token.peakMcapCurrency === "BNB" ? <BnbMark className="h-6 w-6" /> : null}
              <span>{formatMcapCompact(token.peakMcapUSD, token.peakMcapCurrency)}</span>
            </div>
          </div>
          <div>
            <div className="text-[var(--text3)]">Final MCAP</div>
            <div className="mt-1 text-3xl text-[var(--text)]">{formatFinalMcap(token.peakMcapCurrency)}</div>
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

        <div className={cn(
          "mt-6 rounded-[18px] bg-[var(--bg)]",
          isPage ? "max-w-[480px] p-4" : "p-5"
        )}>
          <h3 className="font-medium text-[var(--text)]">Obituary</h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--text2)]">{token.obituary}</p>
        </div>

        <div className={cn("mt-6", isPage ? "max-w-[480px]" : "")}>
          <h3 className="font-medium text-[var(--text)]">Epitaph</h3>
          <EpitaphCard epitaph={token.epitaph || "The docs were beautiful. The code was not."} className="mt-3" />
        </div>

        <div className={cn("mt-5 flex gap-3", isPage ? "max-w-[480px]" : "")}>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text2)]">[]</button>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${token.name} - ${token.epitaph || token.obituary.slice(0, 80)}`)}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-[var(--accent-violet)] px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:brightness-110">
            Share Obituary
          </a>
        </div>
      </div>
    </div>
  )
}
