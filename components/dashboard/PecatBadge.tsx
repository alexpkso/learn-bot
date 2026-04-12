'use client'

type Props = { lastPecat: number }

export default function PecatBadge({ lastPecat }: Props) {
  const n = Math.min(5, Math.max(0, lastPecat || 0))
  return (
    <div className="rounded-card border border-border bg-white p-3.5">
      <div className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
        Последний pečat
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-6 w-6 rounded-md border text-center text-[11px] leading-6 ${
              i < n
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-border bg-bg text-text-2'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  )
}
