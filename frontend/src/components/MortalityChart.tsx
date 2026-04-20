import { causeLabel } from "./CauseBadge"
import type { CauseCode } from "../types/death"
import { cn } from "../lib/utils"
import { getCauseMeta } from "../lib/ui"

export function MortalityChart({
  distribution,
}: {
  distribution: { cause: string; count: number; percent: number }[]
}) {
  const sorted = [...distribution].sort((a, b) => b.percent - a.percent)

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text3)]">Mortality Overview</h3>
      <p className="mt-2 text-sm text-[var(--text2)]">Share of recorded deaths by cause.</p>
      <div className="mt-5 space-y-4">
        {sorted.map((row) => {
          const meta = getCauseMeta(row.cause as CauseCode)

          return (
            <div key={row.cause}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-[var(--text2)]">{causeLabel(row.cause as CauseCode)}</span>
                <span className="font-mono text-[var(--text3)]">{row.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                <div
                  className={cn("h-full rounded-full transition-all")}
                  style={{ width: `${Math.min(100, row.percent)}%`, background: `linear-gradient(90deg, ${meta.accent}, rgba(255,255,255,0.4))` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
