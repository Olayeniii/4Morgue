import type { CauseCode, DeathRecord, McapCurrency } from "../types/death"

export function formatTimeAgo(iso: string) {
  const value = new Date(iso).getTime()
  if (Number.isNaN(value)) return iso

  const diff = Math.max(0, Date.now() - value)
  const minute = 60_000
  const hour = minute * 60
  const day = hour * 24

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute))
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  }

  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour))
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  const days = Math.max(1, Math.round(diff / day))
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

export function formatLifespan(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.round((minutes / 60) * 10) / 10}h`
  return `${Math.round((minutes / 1440) * 10) / 10}d`
}

export function shortenAddressClean(addr: string, left = 6, right = 4) {
  if (!addr || addr.length < 12) return addr
  return `${addr.slice(0, left)}...${addr.slice(-right)}`
}

export function formatUsdCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${Math.round(n).toLocaleString()}`
}

export function formatMcapCompact(n: number, currency: McapCurrency = "USD") {
  if (currency === "BNB") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M BNB`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K BNB`
    if (n >= 100) return `${Math.round(n).toLocaleString()} BNB`
    return `${n.toFixed(2)} BNB`
  }

  return formatUsdCompact(n)
}

export function getMcapLabel(currency: McapCurrency = "USD") {
  return currency === "BNB" ? "Peak MCAP (BNB)" : "Peak MCAP"
}

export function formatFinalMcap(currency: McapCurrency = "USD") {
  return currency === "BNB" ? "0 BNB" : "$0.00"
}

type CauseMeta = {
  label: string
  marker: "diamond" | "dot" | "ring" | "square" | "spark"
  accent: string
  tint: string
}

const FALLBACK_CAUSE_META: CauseMeta = {
  label: "Unknown",
  marker: "dot",
  accent: "var(--accent-gray)",
  tint: "var(--tint-gray)",
}

const CAUSE_META: Record<CauseCode, CauseMeta> = {
  DEV_DUMP: {
    label: "Dev Dump",
    marker: "diamond",
    accent: "var(--accent-red)",
    tint: "var(--tint-red)",
  },
  QUIET_FADE: {
    label: "Quiet Fade",
    marker: "dot",
    accent: "var(--accent-gray)",
    tint: "var(--tint-gray)",
  },
  NEVER_LAUNCHED: {
    label: "Never Born",
    marker: "ring",
    accent: "var(--accent-indigo)",
    tint: "var(--tint-indigo)",
  },
  STALLED_AT_90: {
    label: "Stalled",
    marker: "square",
    accent: "var(--accent-amber)",
    tint: "var(--tint-amber)",
  },
  SPEED_RUG: {
    label: "Speed Rug",
    marker: "spark",
    accent: "var(--accent-orange)",
    tint: "var(--tint-orange)",
  },
}

const CAUSE_ALIASES: Record<string, CauseCode> = {
  NEVER_BORN: "NEVER_LAUNCHED",
  NEVER_LAUNCH: "NEVER_LAUNCHED",
  STALLED: "STALLED_AT_90",
  STALLED_90: "STALLED_AT_90",
}

export function normalizeCauseCode(cause: string | null | undefined): CauseCode | null {
  if (!cause) return null
  if (cause in CAUSE_META) return cause as CauseCode
  return CAUSE_ALIASES[cause] ?? null
}

export function getCauseMeta(cause: string | null | undefined): CauseMeta {
  const normalized = normalizeCauseCode(cause)
  return normalized ? CAUSE_META[normalized] : FALLBACK_CAUSE_META
}

const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(84,101,255,0.78), rgba(36,44,86,0.92) 58%, rgba(19,18,36,0.95))",
  "linear-gradient(135deg, rgba(243,133,255,0.34), rgba(62,75,167,0.74) 48%, rgba(27,27,42,0.96))",
  "linear-gradient(135deg, rgba(255,147,121,0.8), rgba(111,66,193,0.28) 46%, rgba(31,23,53,0.95))",
  "linear-gradient(135deg, rgba(41,77,255,0.8), rgba(28,36,66,0.88) 48%, rgba(9,14,37,0.98))",
  "linear-gradient(135deg, rgba(255,95,109,0.68), rgba(255,195,113,0.42) 45%, rgba(37,17,54,0.95))",
]

export function getTokenArtwork(token: DeathRecord) {
  const seed = `${token.address}:${token.symbol}:${token.causeOfDeath}`
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % CARD_GRADIENTS.length
  const meta = getCauseMeta(token.causeOfDeath)

  return {
    background: CARD_GRADIENTS[index],
    glow: `radial-gradient(circle at 25% 25%, ${meta.tint}, transparent 55%)`,
  }
}
