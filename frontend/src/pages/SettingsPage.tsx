import { useEffect, useState } from "react"
import { AppShell } from "../components/AppShell"
import { fetchLive } from "../lib/api"
import type { DeathRecord } from "../types/death"

export function SettingsPage() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<DeathRecord[]>([])
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")

  useEffect(() => {
    void fetchLive()
      .then((data) => {
        setCount(data.count)
        setItems(data.items)
        setApiStatus("online")
      })
      .catch(() => setApiStatus("offline"))
  }, [])

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001"
  const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001"

  return (
    <AppShell deathCount={count} sidebarItems={items} apiStatus={apiStatus}>
      <main className="p-4 lg:p-6">
        <h1 className="font-display text-5xl leading-none text-[var(--text)]">Settings</h1>
        <p className="mt-3 text-sm text-[var(--text2)]">System configuration and service health.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text3)]">API Status</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--text2)]">
              <div className="flex items-center justify-between">
                <span>Backend</span>
                <span className={apiStatus === "online" ? "text-emerald-400" : apiStatus === "offline" ? "text-red-400" : "text-[var(--text3)]"}>{apiStatus}</span>
              </div>
              <div className="break-all text-[var(--text3)]">{apiUrl}</div>
              <div className="break-all text-[var(--text3)]">{wsUrl}</div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text3)]">Data Sources</h2>
            <div className="mt-4 space-y-2 text-sm text-[var(--text2)]">
              <div>Dune Analytics</div>
              <div>Four.meme API</div>
              <div>GEMINI. GROQ. MISTRAL</div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text3)]">About</h2>
            <p className="mt-4 text-sm text-[var(--text2)]">FourMorgue v0.1. A memorial for Four.meme tokens on BNB Chain.</p>
          </section>
        </div>
      </main>
    </AppShell>
  )
}
