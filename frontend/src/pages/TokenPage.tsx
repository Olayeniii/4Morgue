import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { DetailPanel } from "../components/DetailPanel"
import { fetchLive, fetchToken } from "../lib/api"
import type { DeathRecord } from "../types/death"

export function TokenPage() {
  const { address = "" } = useParams()
  const [token, setToken] = useState<DeathRecord | null>(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchLive().then((data) => setCount(data.count))
  }, [])

  useEffect(() => {
    if (!address) return
    void fetchToken(address).then((item) => {
      setToken(item)
      if (!item) setError("Token not found in the graveyard.")
    })
  }, [address])

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-5 text-[var(--text)] lg:px-5">
      <div className="mx-auto max-w-[760px]">
        <header className="panel-shell flex items-center justify-between rounded-[24px] px-5 py-4">
          <Link to="/" className="text-sm text-[var(--text2)] hover:text-[var(--text)]">Back to live feed</Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text3)]">{count.toLocaleString()} interred</span>
        </header>
        <div className="mt-5">
          {error ? <p className="text-red-400">{error}</p> : null}
          {token ? <DetailPanel token={token} variant="page" /> : !error ? <p className="text-sm text-[var(--text3)]">Loading...</p> : null}
        </div>
      </div>
    </div>
  )
}
