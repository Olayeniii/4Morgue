import type { DeathRecord } from "../types/death"

export function getApiBase() {
  return import.meta.env.VITE_API_URL || "http://localhost:3001"
}

export async function fetchLive() {
  const r = await fetch(`${getApiBase()}/api/deaths/live`)
  if (!r.ok) throw new Error("Failed to load live feed")
  return r.json() as Promise<{ count: number; items: DeathRecord[] }>
}

export async function fetchGraveyard(params: {
  cursor?: string
  limit?: number
  q?: string
  cause?: string
}) {
  const u = new URL(`${getApiBase()}/api/deaths/graveyard`)
  if (params.cursor) u.searchParams.set("cursor", params.cursor)
  if (params.limit) u.searchParams.set("limit", String(params.limit))
  if (params.q) u.searchParams.set("q", params.q)
  if (params.cause) u.searchParams.set("cause", params.cause)
  const r = await fetch(u)
  if (!r.ok) throw new Error("Failed to load graveyard")
  return r.json() as Promise<{
    items: DeathRecord[]
    nextCursor: string | null
    total: number
  }>
}

export async function fetchToken(address: string) {
  const r = await fetch(`${getApiBase()}/api/deaths/${encodeURIComponent(address)}`)
  if (r.status === 404) return null
  if (!r.ok) throw new Error("Failed to load token")
  return r.json() as Promise<DeathRecord>
}

export async function fetchMortality() {
  const r = await fetch(`${getApiBase()}/api/deaths/stats/mortality`)
  if (!r.ok) throw new Error("Failed to load stats")
  return r.json() as Promise<{
    distribution: { cause: string; count: number; percent: number }[]
  }>
}
