export function getNextReviewDate(
  status: string,
  streak: number,
  correct: boolean
): Date {
  const now = new Date()

  if (!correct) {
    now.setDate(now.getDate() + 1)
    return now
  }

  const intervals: Record<string, number[]> = {
    new: [1, 1, 1],
    learning: [1, 3, 7],
    learned: [14],
    problem: [1, 1, 3],
  }

  const daysMap = intervals[status] ?? [1]
  const idx = Math.min(streak, daysMap.length - 1)
  const days = daysMap[idx] ?? 1
  now.setDate(now.getDate() + days)
  return now
}

export function getNextStatus(
  current: string,
  streak: number,
  correct: boolean
): string {
  if (!correct) return 'problem'
  if (current === 'new' && streak >= 2) return 'learning'
  if (current === 'learning' && streak >= 2) return 'learned'
  if (current === 'problem' && streak >= 1) return 'learning'
  return current
}
