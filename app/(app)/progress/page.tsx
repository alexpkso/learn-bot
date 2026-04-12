'use client'

import { useEffect, useState } from 'react'

type Session = {
  id: string
  type: string
  module: number
  pecat: number | null
  xp_earned: number
  summary: string | null
  created_at: string
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/sessions')
      .then((r) => r.json())
      .then((j: { sessions: Session[] }) => setSessions(j.sessions ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-[18px] font-bold text-text-1">Прогресс</h1>
        <p className="text-[12px] text-text-2">История занятий (сохраняется на сервере).</p>
      </div>

      <div className="rounded-card border border-border bg-white">
        {loading ? (
          <p className="p-4 text-[13px] text-text-2">Загрузка…</p>
        ) : sessions.length === 0 ? (
          <p className="p-4 text-[13px] text-text-2">Пока нет записей — начните с «Занятие».</p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="px-3.5 py-3 text-[13px]">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-text-1">
                    {new Date(s.created_at).toLocaleString('ru-RU')} ·{' '}
                    {s.type === 'morning' ? 'утро' : 'вечер'} · модуль {s.module}
                  </span>
                  {s.pecat != null && (
                    <span className="text-[11px] text-text-2">pečat {s.pecat}</span>
                  )}
                </div>
                {s.summary && (
                  <p className="mt-1 text-[12px] leading-relaxed text-text-2">{s.summary}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
