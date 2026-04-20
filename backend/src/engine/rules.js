/** Tunable death thresholds (DATA.md) */
export const DEATH_RULES = {
  QUIET_FADE: {
    noTradesMinutes: 30,
    minBuyers: 5,
  },
  NEVER_LAUNCHED: {
    noTradesMinutes: 15,
    maxBuyers: 3,
  },
  DEV_DUMP: {
    creatorSellPercent: 50,
    priceDropPercent: 70,
  },
  SPEED_RUG: {
    lifespanMinutes: 5,
    priceDropPercent: 90,
  },
  STALLED_AT_90: {
    bondingCurveMin: 85,
    bondingCurveMax: 99,
    stalledMinutes: 60,
  },
}
