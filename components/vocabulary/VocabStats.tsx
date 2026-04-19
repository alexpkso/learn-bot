'use client'

import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { VOCAB_STATS } from '@/lib/vocab/vocab-data'

interface Stats {
  total: number
  due: number
  byStatus: { new: number; learning: number; learned: number; problem: number }
  byTopic: Record<string, number>
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Новые', learning: 'Учится', learned: 'Выучены', problem: 'Трудные',
}
const STATUS_COLOR: Record<string, string> = {
  new: 'text-gray-600 bg-gray-50',
  learning: 'text-yellow-700 bg-yellow-50',
  learned: 'text-green-700 bg-green-50',
  problem: 'text-red-600 bg-red-50',
}

const TOPIC_LABEL: Record<string, string> = {
  verb: 'Глаголы', noun: 'Существительные', adjective: 'Прилагательные', preposition: 'Предлоги',
}

export default function VocabStats({ onImportDone }: { onImportDone?: () => void }) {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadStats() {
    setLoading(true)
    const res = await fetch('/api/words/stats')
    if (res.ok) setStats((await res.json()) as Stats)
    setLoading(false)
  }

  useEffect(() => { void loadStats() }, [])

  async function importVocab() {
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await fetch('/api/words/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const j = (await res.json()) as { imported?: number; message?: string; error?: string }
      if (j.error) {
        setImportMsg(`Ошибка: ${j.error}`)
      } else {
        setImportMsg(`Импортировано ${j.imported ?? 0} слов`)
        void loadStats()
        onImportDone?.()
      }
    } catch {
      setImportMsg('Ошибка сети')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Import banner */}
      {stats !== null && stats.total === 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
          <p className="text-[13px] font-semibold text-blue-800">
            Словарь пуст — импортируй {VOCAB_STATS.total} слов из базы
          </p>
          <p className="mt-0.5 text-[12px] text-blue-600">
            {VOCAB_STATS.verbs} глаголов · {VOCAB_STATS.nouns} существительных ·{' '}
            {VOCAB_STATS.adjectives} прилагательных · {VOCAB_STATS.prepositions} предлогов
          </p>
          <button
            onClick={() => void importVocab()}
            disabled={importing}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {importing ? 'Импорт…' : 'Импортировать словарь'}
          </button>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="text-[12px] text-text-2">Загрузка…</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.entries(stats.byStatus) as [string, number][]).map(([s, n]) => (
              <div key={s} className={`rounded-xl px-3 py-2.5 ${STATUS_COLOR[s]}`}>
                <div className="text-[20px] font-bold">{n}</div>
                <div className="text-[11px] font-medium">{STATUS_LABEL[s]}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.entries(stats.byTopic) as [string, number][]).map(([t, n]) => (
              <span key={t} className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-text-2">
                {TOPIC_LABEL[t] ?? t}: {n}
              </span>
            ))}
          </div>

          {stats.due > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-[13px] font-semibold text-orange-700">
              {stats.due} слов ждут повторения прямо сейчас
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => void importVocab()}
              disabled={importing}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-text-2 hover:bg-gray-50 disabled:opacity-60"
            >
              <Download className="h-3 w-3" />
              {importing ? 'Импорт…' : 'Обновить из базы'}
            </button>
            <button
              onClick={() => void loadStats()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-text-2 hover:bg-gray-50"
            >
              <RefreshCw className="h-3 w-3" /> Обновить
            </button>
          </div>
          {importMsg && (
            <div className="text-[12px] text-text-2">{importMsg}</div>
          )}
        </>
      ) : null}
    </div>
  )
}
