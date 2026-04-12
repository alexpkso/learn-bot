'use client'

import { getLevelLabel } from '@/lib/claude/levels'

type Props = { xp: number }

export default function XPBar({ xp }: Props) {
  const level = getLevelLabel(xp)
  const cap = 2000
  const pct = Math.min(100, Math.round((xp / cap) * 100))

  return (
    <div className="rounded-card border border-border bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
          Опыт (XP)
        </span>
        <span className="text-[11px] font-semibold text-text-1">
          {xp} · {level}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
