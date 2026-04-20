import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AppShell } from "../components/AppShell"
import { FeedCard } from "../components/FeedCard"
import { MortalityChart } from "../components/MortalityChart"
import { fetchGraveyard, fetchLive, fetchMortality } from "../lib/api"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import type { DeathRecord } from "../types/death"

export function GraveyardPage() {
  const [params] = useSearchParams()
  const [items, setItems] = useState<DeathRecord[]>([])
  const [sidebarItems, setSidebarItems] = useState<DeathRecord[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState("")
  const debouncedQ = useDebouncedValue(q, 300)
  const [causeFilter, setCauseFilter] = useState(() => params.get("cause") || "")
  const [loading, setLoading] = useState(true)
  const [mortality, setMortality] = useState<{ cause: string; count: number; percent: number }[]>([])
  const [deathCount, setDeathCount] = useState(0)
  const [selected, setSelected] = useState<DeathRecord | null>(null)
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")

  useEffect(() => {
    setCauseFilter(params.get("cause") || "")
  }, [params])

  useEffect(() => {
    void fetchMortality().then((data) => setMortality(data.distribution))
    void fetchLive()
      .then((data) => {
        setDeathCount(data.count)
        setSidebarItems(data.items)
        setApiStatus("online")
      })
      .catch(() => setApiStatus("offline"))
  }, [])

  const fetchFirstPage = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchGraveyard({ limit: 20, q: debouncedQ, cause: causeFilter })
      setItems(data.items)
      setNextCursor(data.nextCursor)
      setTotal(data.total)
      setSelected(data.items[0] ?? null)
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, causeFilter])

  useEffect(() => {
    void fetchFirstPage()
  }, [fetchFirstPage])

  const loadMore = useCallback(async () => {
    if (!nextCursor) return
    const data = await fetchGraveyard({ cursor: nextCursor, limit: 20, q: debouncedQ, cause: causeFilter })
    setItems((prev) => [...prev, ...data.items])
    setNextCursor(data.nextCursor)
  }, [nextCursor, debouncedQ, causeFilter])

  return (
    <AppShell deathCount={deathCount} sidebarItems={sidebarItems} apiStatus={apiStatus} right={<MortalityChart distribution={mortality} />}>
      <main className="p-4 lg:p-6">
        <header>
          <h1 className="font-display text-5xl leading-none text-[var(--text)]">Graveyard</h1>
          <p className="mt-3 text-sm text-[var(--text2)]">{total.toLocaleString()} recorded deaths{debouncedQ ? " (filtered)" : ""}.</p>
        </header>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <input
            type="search"
            placeholder="Search by name, symbol, or address"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="flex-1 rounded-[18px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none"
          />
          <select
            value={causeFilter}
            onChange={(event) => setCauseFilter(event.target.value)}
            className="rounded-[18px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)]"
          >
            <option value="">All causes</option>
            <option value="DEV_DUMP">Dev Dump</option>
            <option value="SPEED_RUG">Speed Rug</option>
            <option value="QUIET_FADE">Quiet Fade</option>
            <option value="STALLED_AT_90">Stalled</option>
            <option value="NEVER_LAUNCHED">Never Born</option>
            <option value="SPEED_RUG,DEV_DUMP">Burn Pit</option>
          </select>
        </div>

        {loading && !items.length ? <p className="mt-6 text-sm text-[var(--text3)]">Loading...</p> : null}

        <div className="mt-6 flex flex-wrap gap-4">
          {items.map((token, index) => (
            <FeedCard key={token.address} token={token} index={index} active={selected?.address === token.address} onSelect={() => setSelected(token)} />
          ))}
        </div>

        {nextCursor ? (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => void loadMore()} className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm text-[var(--text2)] hover:border-[var(--border-strong)] hover:text-[var(--text)]">
              Load More
            </button>
          </div>
        ) : null}
      </main>
    </AppShell>
  )
}

