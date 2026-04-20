import type { ReactNode } from "react"
import type { DeathRecord } from "../types/death"
import { Sidebar } from "./Sidebar"

export function AppShell({
  children,
  right,
  deathCount,
  sidebarItems = [],
  apiStatus = "checking",
}: {
  children: ReactNode
  right?: ReactNode
  deathCount: number
  sidebarItems?: DeathRecord[]
  apiStatus?: "checking" | "online" | "offline"
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[1720px] flex-col px-4 py-4 lg:grid lg:min-h-screen lg:grid-cols-[240px_minmax(0,1fr)_360px] lg:gap-4 lg:px-5 lg:py-5">
        <Sidebar deathCount={deathCount} items={sidebarItems} apiStatus={apiStatus} />
        <div className="panel-shell min-h-0 min-w-0 overflow-hidden rounded-[24px]">
          {children}
          {right ? (
            <div className="space-y-4 border-t border-[var(--border)] p-4 lg:hidden">{right}</div>
          ) : null}
        </div>
        {right ? (
          <aside className="panel-shell hidden min-h-0 space-y-4 overflow-y-auto rounded-[24px] p-4 lg:block">
            {right}
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>
    </div>
  )
}
