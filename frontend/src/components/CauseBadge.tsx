import type { CauseCode } from "../types/death"
import { cn } from "../lib/utils"
import { getCauseMeta } from "../lib/ui"

export function causeLabel(c: string) {
  return getCauseMeta(c).label
}

export function CauseBadge({ cause, className }: { cause: CauseCode | string; className?: string }) {
  const meta = getCauseMeta(cause)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
        className
      )}
      title={meta.label}
      style={{
        borderColor: meta.accent,
        background: meta.tint,
        color: meta.accent,
      }}
    >
      <span
        className={cn(
          "block shrink-0",
          meta.marker === "dot" && "h-1.5 w-1.5 rounded-full",
          meta.marker === "ring" && "h-2 w-2 rounded-full border",
          meta.marker === "diamond" && "h-2 w-2 rotate-45 rounded-[1px]",
          meta.marker === "square" && "h-1.5 w-1.5 rounded-[2px]",
          meta.marker === "spark" && "h-2 w-2 rounded-full"
        )}
        style={{
          background:
            meta.marker === "ring"
              ? "transparent"
              : meta.marker === "spark"
              ? `radial-gradient(circle, ${meta.accent} 0%, ${meta.accent} 35%, transparent 70%)`
              : meta.accent,
          borderColor: meta.accent,
        }}
      />
      {meta.label}
    </span>
  )
}
