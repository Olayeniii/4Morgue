import { DEATH_RULES } from "./rules.js"

/**
 * @param {import('./stateMachine.js').TokenMetrics} m
 * @returns {import('./stateMachine.js').CauseCode}
 */
export function classifyCause(m) {
  const rules = DEATH_RULES
  const lifeMin = m.lifespanMinutes
  const buyers = m.totalBuyers
  const trades = m.totalTrades
  const bc = m.bondingCurveMax
  const stallMin = m.stalledNearGraduationMinutes
  const creatorSold = m.creatorSellPercentGuess
  const drop = m.priceDropPercentGuess

  if (
    bc >= rules.STALLED_AT_90.bondingCurveMin &&
    bc < 100 &&
    stallMin >= rules.STALLED_AT_90.stalledMinutes
  ) {
    return "STALLED_AT_90"
  }

  if (creatorSold >= rules.DEV_DUMP.creatorSellPercent) {
    return "DEV_DUMP"
  }

  if (lifeMin >= rules.NEVER_LAUNCHED.noTradesMinutes && buyers <= rules.NEVER_LAUNCHED.maxBuyers && trades <= 2) {
    return "NEVER_LAUNCHED"
  }

  if (m.minutesSinceLastTrade >= rules.QUIET_FADE.noTradesMinutes && buyers >= rules.QUIET_FADE.minBuyers) {
    return "QUIET_FADE"
  }

  if (
    lifeMin <= rules.SPEED_RUG.lifespanMinutes + 2 &&
        trades > 0 &&
    (drop >= rules.SPEED_RUG.priceDropPercent || (drop === 0 && trades >= 2 && lifeMin <= 8))
  ) {
    return "SPEED_RUG"
  }

  if (buyers <= rules.NEVER_LAUNCHED.maxBuyers && trades <= 3) {
      return "NEVER_LAUNCHED"
  }

  return "QUIET_FADE"
}
