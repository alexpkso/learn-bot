'use client'

import { useState, useEffect, useCallback } from 'react'
import FlashCard, { type CardData } from './FlashCard'
import { Trophy, RotateCcw } from 'lucide-react'

interface Props {
  topic?: string
  limit?: number
}

interface RawWord {
  id: string
  serbian: string
  russian: string
  topic: string
  extras: string | null
  status: string
  streak: number
  error_count: number
  next_review_at: string
}

function toCardData(w: RawWord): CardData {
  return {
    id: w.id,
    word: w.serbian,
    translation: w.russian,
    topic: w.topic ?? 'other',
    extras: w.extras ? (JSON.parse(w.extras) as Record<string, string>) : {},
    status: w.status,
    streak: w.streak ?? 0,
  }
}

export default function FlashcardSession({ topic, limit = 20 }: Props) {
  const [cards, setCards]       = useState<CardData[]>([])
  const [idx, setIdx]           = useState(0)
  const [done, setDone]         = useState(false)
  const [correct, setCorrect]   = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/words/due?limit=${limit}${topic ? `&topic=${topic}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Ошибка загрузки')
      const j = (await res.json()) as { words: RawWord[] }
      setCards((j.words ?? []).map(toCardData))
      setIdx(0)
      setDone(false)
      setCorrect(0)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [topic, limit])

  useEffect(() => { void loadCards() }, [loadCards])

  async function handleRate(id: string, isCorrect: boolean) {
    await fetch('/api/words', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, correct: isCorrect }),
    })
    if (isCorrect) setCorrect(c => c + 1)

    // Advance to next card after short delay
    setTimeout(() => {
      if (idx + 1 >= cards.length) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
      }
    }, 1200)
  }

  function skip() {
    if (idx + 1 >= cards.length) setDone(true)
    else setIdx(i => i + 1)
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-[13px] text-text-2">
        Загрузка карточек…
      </div>
    )
  }
  if (error) {
    return <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-600">{error}</div>
  }
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <Trophy className="h-10 w-10 text-green-600" />
        <p className="font-semibold text-green-700">Нет карточек для повторения!</p>
        <p className="text-[12px] text-green-600">Все слова повторены. Загляни позже или добавь новые.</p>
      </div>
    )
  }
  if (done) {
    const total = cards.length
    const pct   = Math.round((correct / total) * 100)
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-white px-6 py-10 text-center">
        <Trophy className="h-10 w-10 text-yellow-500" />
        <h3 className="text-[18px] font-bold text-text-1">Сессия завершена!</h3>
        <div className="text-[14px] text-text-2">
          Правильно: <span className="font-bold text-green-600">{correct}</span> / {total} ({pct}%)
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <button
          onClick={() => void loadCards()}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700"
        >
          <RotateCcw className="h-4 w-4" /> Ещё раунд
        </button>
      </div>
    )
  }

  const card = cards[idx]!
  const total = cards.length

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-[12px] text-text-2">
        <span>Карточка {idx + 1} из {total}</span>
        <span>{correct} верно</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((idx) / total) * 100}%` }}
        />
      </div>

      <FlashCard card={card} onRate={handleRate} onSkip={skip} />
    </div>
  )
}
