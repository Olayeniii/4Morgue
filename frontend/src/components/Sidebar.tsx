import { NavLink } from "react-router-dom"
import logo from "../4morgue.png"
import type { DeathRecord } from "../types/death"
import { causeLabel } from "./CauseBadge"
import { DeathCounter } from "./DeathCounter"
import { formatTimeAgo } from "../lib/ui"

function NavIcon({ kind }: { kind: "home" | "graveyard" | "burn" | "settings" }) {
  if (kind === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
      </svg>
    )
  }
  if (kind === "graveyard") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4c2.8 0 5 2.2 5 5v11H7V9c0-2.8 2.2-5 5-5Z" />
        <path d="M12 6v8" />
        <path d="M9 10h6" />
      </svg>
    )
  }
  if (kind === "burn") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c2 3 5 4.5 5 9a5 5 0 0 1-10 0c0-1.8.7-3.4 2-4.8.8 1.6 2.4 2.6 3 2.8-.3-2 .3-4.2 0-7Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.6 5.6 2.1 2.1" />
      <path d="m16.3 16.3 2.1 2.1" />
      <path d="m18.4 5.6-2.1 2.1" />
      <path d="m7.7 16.3-2.1 2.1" />
      <circle cx="12" cy="12" r="3.6" />
    </svg>
  )
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-all",
    isActive
      ? "bg-[linear-gradient(90deg,rgba(119,84,255,0.22),rgba(64,59,112,0.38))] text-[var(--text)]"
      : "text-[var(--text2)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]",
  ].join(" ")

export function Sidebar({
  deathCount,
  items,
  apiStatus,
}: {
  deathCount: number
  items: DeathRecord[]
  apiStatus: "checking" | "online" | "offline"
}) {
  const links = [
    { to: "/", label: "Home", icon: "home" as const },
    { to: "/graveyard", label: "Graveyard", icon: "graveyard" as const },
    { to: "/graveyard?cause=SPEED_RUG,DEV_DUMP", label: "Burn Pit", icon: "burn" as const },
    { to: "/settings", label: "Settings", icon: "settings" as const },
  ]
  const recentItems = items.slice(0, 3)
  const statusLabel = apiStatus === "online" ? "Live" : apiStatus === "offline" ? "Offline" : "Checking"
  const statusClass =
    apiStatus === "online"
      ? "text-emerald-400"
      : apiStatus === "offline"
      ? "text-red-400"
      : "text-[var(--text3)]"

  return (
    <aside className="panel-shell mb-4 flex flex-col gap-6 rounded-[24px] p-5 lg:mb-0 lg:min-h-[calc(100vh-2.5rem)]">
      <div className="flex items-center gap-3 px-2">
        <img src={logo} alt="FourMorgue" className="h-11 w-11 rounded-xl object-contain" />
        <div>
          <div className="font-display text-[1.85rem] leading-none tracking-tight text-[var(--text)]">
            Four<span className="text-[var(--accent-violet)]">Morgue</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text3)]">
            Archive of the departed
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 lg:flex-col">
        {links.map((link) => (
          <NavLink
            key={link.label}
            to={link.to}
            className={({ isActive }) => linkClass({ isActive })}
            end={link.to === "/"}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text2)]">
              <NavIcon kind={link.icon} />
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <DeathCounter count={deathCount} />

      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-4 space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text3)]">
            Live Feed
          </div>
          <div className="space-y-3 text-sm text-[var(--text2)]">
            {recentItems.length ? (
              recentItems.map((item) => (
                <div key={item.address}>
                  <div className="font-mono text-[11px] text-[var(--accent-violet)]">
                    {formatTimeAgo(item.diedAt)}
                  </div>
                  <div>{item.name}</div>
                  <div className="text-[var(--text3)]">{causeLabel(item.causeOfDeath)}</div>
                </div>
              ))
            ) : (
              <div className="text-[var(--text3)]">No recent interments yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text3)]">
          <span>API Status</span>
          <span className={statusClass}>{statusLabel}</span>
        </div>
      </div>
    </aside>
  )
}
