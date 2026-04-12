import type { OnboardingPayload } from '@/lib/types'

export function buildLearnerNotes(o: OnboardingPayload): string {
  const lines = [
    `Имя: ${o.name}`,
    `Язык обучения: ${o.language}`,
    `Уровень (самооценка): ${o.level}`,
    `Цели: ${o.goal}`,
    `Контекст: ${o.context}`,
    `Минут в день: ${o.time}`,
  ]
  if (o.priorities) lines.push(`Приоритетные темы: ${o.priorities}`)
  if (o.blockers) lines.push(`Сложности: ${o.blockers}`)
  if (o.practice_style) lines.push(`Предпочтения по формату: ${o.practice_style}`)
  return lines.join('\n')
}
