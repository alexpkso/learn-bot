'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const pills: Record<string, string> = {
  new: 'bg-primary-light text-primary',
  learning: 'bg-orange-50 text-orange',
  learned: 'bg-green-50 text-green-700',
  problem: 'bg-red-50 text-red',
}

type Row = {
  id: string
  serbian: string
  russian: string
  status: string
  next_review_at: string
}

export default function VocabularyPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [serbian, setSerbian] = useState('')
  const [russian, setRussian] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/words')
    if (!res.ok) return
    const j = (await res.json()) as { words: Row[] }
    setRows(j.words ?? [])
  }

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [])

  async function addWord(e: React.FormEvent) {
    e.preventDefault()
    if (!serbian.trim() || !russian.trim()) return
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serbian, russian }),
    })
    if (res.ok) {
      setSerbian('')
      setRussian('')
      void load()
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-[18px] font-bold text-text-1">Словарь</h1>
        <p className="text-[12px] text-text-2">
          Колонка «язык» хранит изучаемое слово (сербский или английский), «перевод» — на русский.
        </p>
      </div>

      <form
        onSubmit={(e) => void addWord(e)}
        className="rounded-card border border-border bg-white p-3.5"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
              Изучаемое
            </label>
            <input
              className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px]"
              value={serbian}
              onChange={(e) => setSerbian(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
              Перевод
            </label>
            <input
              className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px]"
              value={russian}
              onChange={(e) => setRussian(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-3 rounded-btn bg-primary px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700"
        >
          Добавить
        </button>
      </form>

      <div className="rounded-card border border-border bg-white">
        {loading ? (
          <p className="p-4 text-[13px] text-text-2">Загрузка…</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-[13px]"
              >
                <span>
                  <span className="font-medium">{w.serbian}</span>
                  <span className="text-text-2"> — {w.russian}</span>
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${pills[w.status] ?? 'bg-bg text-text-2'}`}
                >
                  {w.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
