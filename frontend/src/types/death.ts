export type CauseCode =
  | "DEV_DUMP"
  | "QUIET_FADE"
  | "NEVER_LAUNCHED"
  | "STALLED_AT_90"
  | "SPEED_RUG"

export type Tone = "savage" | "eulogy" | "comic" | "tragic"
export type McapCurrency = "USD" | "BNB"

export interface DeathRecord {
  address: string
  name: string
  symbol: string
  createdAt: string
  diedAt: string
  lifespanMinutes: number
  peakMcapUSD: number
  peakMcapCurrency: McapCurrency
  totalBuyers: number
  totalTrades: number
  creatorWallet: string
  causeOfDeath: CauseCode
  bondingCurveMax: number
  obituary: string
  epitaph: string
  tone: Tone
  tokenImageUrl: string
  cardImageUrl: string
}
