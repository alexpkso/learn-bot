'use client'

import type { ProgramModule } from '@/lib/types'

export default function ProgramPreview({ modules }: { modules: ProgramModule[] }) {
  return (
    <div className="space-y-3">
      {modules.map((m) => (
        <div
          key={m.id}
          className="rounded-card border border-border bg-white p-3.5 shadow-sm"
        >
          <div className="text-[11px] font-black uppercase tracking-[0.05em] text-text-1">
            Модуль {m.id}: {m.title}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-text-2">{m.description}</p>
          <div className="mt-2 text-[10px] text-text-2">
            ~{m.estimated_days} дн. · тем: {m.topics?.length ?? 0}
          </div>
        </div>
      ))}
    </div>
  )
}
