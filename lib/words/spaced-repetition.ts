/**
 * SM-2 inspired spaced repetition system.
 *
 * Statuses:
 *   new      → just added, shown in session until learned
 *   learning → seen correctly 2+ times, intervals grow
 *   learned  → mastered (streak ≥ 5), long intervals
 *   problem  → answered wrong, short recovery intervals
 *
 * Intervals (days):
 *   new:      0 → same session (minutes), 1 → 1d, 2 → 3d
 *   learning: 0→1d, 1→3d, 2→7d, 3→14d, 4→21d
 *   learned:  0→30d, 1→60d, 2→90d
 *   problem:  0→next session (hours), 1→1d, 2→3d
 */

const HOURS = (h: number) => (h * 60 * 60 * 1000)
const DAYS  = (d: number) => (d * 24 * 60 * 60 * 1000)

export function getNextReviewDate(
  status: string,
  streak: number,
  correct: boolean
): Date {
  const now = new Date()

  if (!correct) {
    // wrong → repeat after a few hours in the same day
    return new Date(now.getTime() + HOURS(4))
  }

  const intervals: Record<string, number[]> = {
    new:      [DAYS(1),  DAYS(3)],
    learning: [DAYS(1),  DAYS(3),  DAYS(7),  DAYS(14), DAYS(21)],
    learned:  [DAYS(30), DAYS(60), DAYS(90)],
    problem:  [HOURS(8), DAYS(1),  DAYS(3)],
  }

  const map = intervals[status] ?? [DAYS(1)]
  const idx = Math.min(streak, map.length - 1)
  return new Date(now.getTime() + map[idx]!)
}

export function getNextStatus(
  current: string,
  streak: number,
  correct: boolean
): string {
  if (!correct) return 'problem'
  if (current === 'new'      && streak >= 2) return 'learning'
  if (current === 'learning' && streak >= 5) return 'learned'
  if (current === 'problem'  && streak >= 2) return 'learning'
  return current
}

/** True when the card is due for review */
export function isDue(nextReviewAt: string): boolean {
  return new Date(nextReviewAt) <= new Date()
}
