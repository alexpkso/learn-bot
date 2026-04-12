'use client'

type Word = { serbian: string; russian: string }

export default function WordsDue({ words }: { words: Word[] }) {
  return (
    <div className="rounded-card border border-border bg-white p-3.5">
      <div className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
        Слова к повторению
      </div>
      <ul className="mt-2 space-y-1 text-[12px] text-text-1">
        {words.length === 0 && (
          <li className="text-text-2">Пока пусто — добавьте слова в разделе «Словарь».</li>
        )}
        {words.slice(0, 8).map((w, i) => (
          <li key={i}>
            <span className="font-medium">{w.serbian}</span>
            <span className="text-text-2"> — {w.russian}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
