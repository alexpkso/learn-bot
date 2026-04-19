'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'

interface WordRow {
  id: string
  serbian: string
  russian: string
  topic: string | null
  status: string
  streak: number
  error_count: number
  next_review_at: string
  extras: string | null
}

const STATUS_PILL: Record<string, string> = {
  new:      'bg-gray-100 text-gray-600',
  learning: 'bg-yellow-50 text-yellow-700',
  learned:  'bg-green-50 text-green-700',
  problem:  'bg-red-50 text-red-600',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'новое', learning: 'учится', learned: 'выучено', problem: 'трудное',
}
const TOPIC_LABEL: Record<string, string> = {
  verb: 'Глагол', noun: 'Сущ.', adjective: 'Прил.', preposition: 'Предлог',
}
const TOPIC_COLOR: Record<string, string> = {
  verb: 'text-blue-600', noun: 'text-green-600',
  adjective: 'text-purple-600', preposition: 'text-orange-600',
}

function ExtrasPreview({ topic, extras }: { topic: string | null; extras: Record<string, string> }) {
  if (topic === 'verb')
    return <span className="text-text-2">{extras.sr_pres} · {extras.sr_perf}</span>
  if (topic === 'noun')
    return <span className="text-text-2">мн. {extras.sr_pl} · {extras.gender}</span>
  if (topic === 'adjective')
    return <span className="text-text-2">{extras.sr_f} · {extras.sr_n}</span>
  if (topic === 'preposition' && extras.ex_sr)
    return <span className="italic text-text-2">{extras.ex_sr}</span>
  return null
}

interface Props {
  refreshTrigger?: number
}

export default function WordTable({ refreshTrigger }: Props) {
  const [words, setWords]         = useState<WordRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setStatus] = useState<string>('all')
  const [filterTopic, setTopic]   = useState<string>('all')
  const [page, setPage]           = useState(0)

  const PER_PAGE = 25

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/words')
    if (res.ok) {
      const j = (await res.json()) as { words: WordRow[] }
      setWords(j.words ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load, refreshTrigger])

  const filtered = words.filter(w => {
    const q = search.toLowerCase()
    if (q && !w.serbian.toLowerCase().includes(q) && !w.russian.toLowerCase().includes(q)) return false
    if (filterStatus !== 'all' && w.status !== filterStatus) return false
    if (filterTopic  !== 'all' && (w.topic ?? 'other') !== filterTopic) return false
    return true
  })

  const pageWords = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-2" />
          <input
            className="rounded-lg border border-border pl-8 pr-3 py-1.5 text-[12px] focus:border-primary focus:outline-none"
            placeholder="Поиск…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <select
          className="rounded-lg border border-border px-2 py-1.5 text-[12px] focus:border-primary focus:outline-none"
          value={filterStatus}
          onChange={e => { setStatus(e.target.value); setPage(0) }}
        >
          <option value="all">Все статусы</option>
          <option value="new">Новые</option>
          <option value="learning">Учится</option>
          <option value="learned">Выучено</option>
          <option value="problem">Трудные</option>
        </select>
        <select
          className="rounded-lg border border-border px-2 py-1.5 text-[12px] focus:border-primary focus:outline-none"
          value={filterTopic}
          onChange={e => { setTopic(e.target.value); setPage(0) }}
        >
          <option value="all">Все типы</option>
          <option value="verb">Глаголы</option>
          <option value="noun">Существительные</option>
          <option value="adjective">Прилагательные</option>
          <option value="preposition">Предлоги</option>
        </select>
        <span className="ml-auto self-center text-[11px] text-text-2">{filtered.length} слов</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {loading ? (
          <p className="p-4 text-[13px] text-text-2">Загрузка…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-[13px] text-text-2">Ничего не найдено</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead className="border-b border-border bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-text-2">Сербский</th>
                <th className="px-3 py-2 text-left font-semibold text-text-2">Русский</th>
                <th className="hidden px-3 py-2 text-left font-semibold text-text-2 sm:table-cell">Доп. формы</th>
                <th className="px-3 py-2 text-left font-semibold text-text-2">Тип</th>
                <th className="px-3 py-2 text-left font-semibold text-text-2">Статус</th>
                <th className="hidden px-3 py-2 text-left font-semibold text-text-2 sm:table-cell">🔥</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageWords.map(w => {
                const extras = w.extras ? (JSON.parse(w.extras) as Record<string, string>) : {}
                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-text-1">{w.serbian}</td>
                    <td className="px-3 py-2 text-text-2">{w.russian}</td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <ExtrasPreview topic={w.topic} extras={extras} />
                    </td>
                    <td className={`px-3 py-2 font-medium ${TOPIC_COLOR[w.topic ?? ''] ?? 'text-text-2'}`}>
                      {TOPIC_LABEL[w.topic ?? ''] ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_PILL[w.status] ?? ''}`}>
                        {STATUS_LABEL[w.status] ?? w.status}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2 text-text-2 sm:table-cell">{w.streak}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-border px-3 py-1 text-[12px] disabled:opacity-40"
          >←</button>
          <span className="text-[12px] text-text-2">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg border border-border px-3 py-1 text-[12px] disabled:opacity-40"
          >→</button>
        </div>
      )}
    </div>
  )
}
