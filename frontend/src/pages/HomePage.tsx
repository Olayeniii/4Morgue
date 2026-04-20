import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AppShell } from "../components/AppShell"
import { DetailPanel } from "../components/DetailPanel"
import { FeedCard } from "../components/FeedCard"
import { RecentInterments } from "../components/RecentInterments"
import { useDeathStream } from "../hooks/useDeathStream"
import type { CauseCode, DeathRecord } from "../types/death"
import { cn } from "../lib/utils"
import { formatTimeAgo, getCauseMeta } from "../lib/ui"

const CAUSES: { id: CauseCode | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Deaths" },
  { id: "DEV_DUMP", label: "Dev Dump" },
  { id: "SPEED_RUG", label: "Speed Rug" },
  { id: "QUIET_FADE", label: "Quiet Fade" },
  { id: "STALLED_AT_90", label: "Stalled" },
  { id: "NEVER_LAUNCHED", label: "Never Born" },
]

interface ToastItem {
  id: string
  token: DeathRecord
}

export function HomePage() {
  const { items, count, loading, error, toast } = useDeathStream()
  const [selected, setSelected] = useState<DeathRecord | null>(null)
  const [panelDismissed, setPanelDismissed] = useState(false)
  const [cause, setCause] = useState<CauseCode | "ALL">("ALL")
  const [q, setQ] = useState("")
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    if (!toast) return
    const id = `${toast.address}-${Date.now()}`
    setSelected((current) => current ?? toast)
    setPanelDismissed(false)
    setToasts((prev) => [...prev.slice(-2), { id, token: toast }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!selected && items.length && !panelDismissed) setSelected(items[0])
  }, [items, selected, panelDismissed])

  const filtered = useMemo(() => {
    let rows = items
    if (cause !== "ALL") rows = rows.filter((token) => token.causeOfDeath === cause)
    if (q.trim()) {
      const query = q.toLowerCase()
      rows = rows.filter(
        (token) =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      )
    }
    return rows
  }, [items, cause, q])

  const right = (
    <div className="space-y-4">
      <DetailPanel
        token={selected}
        className="max-h-[min(78vh,980px)]"
        onClose={() => {
          setSelected(null)
          setPanelDismissed(true)
        }}
      />
      <RecentInterments items={items} />
    </div>
  )

  return (
    <AppShell
      deathCount={count}
      sidebarItems={items}
      apiStatus={error ? "offline" : loading && !items.length ? "checking" : "online"}
      right={right}
    >
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map(({ id, token }) => {
            const meta = getCauseMeta(token.causeOfDeath)

            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.92 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="pointer-events-auto w-80 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]"
              >
                <motion.div
                  className="h-[2px]"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4, ease: "linear" }}
                  style={{ originX: 0, background: meta.accent }}
                />
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-[var(--text)]">{token.name}</div>
                      <div className="mt-1 text-xs text-[var(--text3)]">{meta.label} · {formatTimeAgo(token.diedAt)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setToasts((prev) => prev.filter((item) => item.id !== id))}
                      className="text-sm text-[var(--text3)]"
                    >
                      x
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <main className="p-4 lg:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl leading-[0.98] text-[var(--text)] md:text-5xl">
              They promised the moon.
              <span className="block text-[var(--accent-violet)]">We keep the receipts.</span>
            </h1>
          </div>

          <div className="w-full max-w-md">
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]">Q</span>
              <input
                type="search"
                placeholder="Search tokens, addresses..."
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg)] py-4 pl-12 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--border-strong)] focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {CAUSES.map((item) => {
            const meta = item.id === "ALL" ? null : getCauseMeta(item.id)
            const value = item.id === "ALL" ? count : items.filter((token) => token.causeOfDeath === item.id).length

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCause(item.id)}
                className={cn(
                  "rounded-[18px] border px-4 py-3 text-left transition-all",
                  cause === item.id ? "border-[var(--border-strong)] bg-[var(--surface-strong)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                )}
                style={meta ? { boxShadow: cause === item.id ? `inset 0 0 0 1px ${meta.accent}` : undefined } : undefined}
              >
                <div className="text-sm text-[var(--text)]">{item.label}</div>
                <div className="mt-1 font-mono text-lg" style={{ color: meta?.accent ?? "var(--accent-violet)" }}>
                  {value.toLocaleString()}
                </div>
              </button>
            )
          })}
        </div>

        {loading ? <p className="mt-6 text-sm text-[var(--text3)]">Loading feed...</p> : null}
        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-4">
          {filtered.map((token, index) => (
            <FeedCard
              key={token.address}
              token={token}
              index={index}
              active={selected?.address === token.address}
              onSelect={() => {
                setSelected(token)
                setPanelDismissed(false)
              }}
            />
          ))}
        </div>

        {!loading && !filtered.length ? <p className="mt-8 text-center text-sm text-[var(--text3)]">No tokens match this filter.</p> : null}
      </main>
    </AppShell>
  )
}
