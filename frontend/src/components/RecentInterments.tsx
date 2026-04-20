import type { DeathRecord } from "../types/death"
import { CauseBadge } from "./CauseBadge"
import { formatTimeAgo, getTokenArtwork } from "../lib/ui"

export function RecentInterments({ items }: { items: DeathRecord[] }) {
  const recent = items.slice(0, 3)

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text3)]">Recently Interred</h3>
        <button type="button" className="text-sm text-[var(--accent-violet)]">See All</button>
      </div>
      <ul className="mt-4 space-y-4">
        {recent.map((token) => {
          const art = getTokenArtwork(token)

          return (
            <li key={token.address} className="flex gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10"
                style={{ background: art.background }}
              >
                {token.tokenImageUrl ? (
                  <img
                    src={token.tokenImageUrl}
                    alt={token.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base text-[var(--text)]">{token.name}</span>
                  <span className="text-sm text-[var(--text3)]">{formatTimeAgo(token.diedAt)}</span>
                </div>
                <div className="mt-1"><CauseBadge cause={token.causeOfDeath} /></div>
                <p className="mt-2 line-clamp-2 text-sm italic text-[var(--text2)]">"{token.epitaph || token.obituary.slice(0, 64)}"</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
