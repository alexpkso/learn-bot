'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgramPreview from '@/components/onboarding/ProgramPreview'
import { createClient } from '@/lib/supabase/client'
import type { ProgramModule } from '@/lib/types'

export default function ProgramConfirmPage() {
  const router = useRouter()
  const [modules, setModules] = useState<ProgramModule[] | null>(null)
  const [programId, setProgramId] = useState<string | null>(null)
  const [refine, setRefine] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: program } = await supabase
        .from('programs')
        .select('id, modules')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cancelled) {
        if (program?.modules) {
          setModules(program.modules as ProgramModule[])
          setProgramId(program.id)
        }
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function confirm() {
    if (!programId) return
    setBusy(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Нет сессии')

      const { error: pErr } = await supabase
        .from('programs')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', programId)
        .eq('user_id', user.id)

      if (pErr) throw pErr

      const { error: uErr } = await supabase
        .from('profiles')
        .update({ onboarding_done: true })
        .eq('id', user.id)

      if (uErr) throw uErr

      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  async function refineProgram() {
    if (!refine.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/program/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: refine.trim(), programId }),
      })
      const j = (await res.json()) as { modules?: ProgramModule[]; error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Ошибка')
      if (j.modules) setModules(j.modules as ProgramModule[])
      setRefine('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-center text-[13px] text-text-2">Загрузка…</p>
  }

  if (!modules?.length) {
    return (
      <div className="rounded-card border border-border bg-white p-5 text-center text-[13px] text-text-2">
        Черновик программы не найден. Вернитесь к{' '}
        <a className="text-primary underline" href="/onboarding">
          онбордингу
        </a>
        .
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[16px] font-bold text-text-1">Ваша программа</h1>
        <p className="mt-1 text-[12px] text-text-2">
          Проверьте модули. Можно попросить изменить акценты — текстом ниже.
        </p>
      </div>

      <ProgramPreview modules={modules} />

      <div className="rounded-card border border-border bg-white p-3.5">
        <label className="text-[10px] font-bold uppercase tracking-wide text-text-2">
          Уточнение для ИИ (необязательно)
        </label>
        <textarea
          rows={3}
          value={refine}
          onChange={(e) => setRefine(e.target.value)}
          placeholder="Например: больше телефонных диалогов, меньше бытовой лексики"
          className="mt-2 w-full resize-y rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
        />
        <button
          type="button"
          disabled={busy || !refine.trim()}
          onClick={() => void refineProgram()}
          className="mt-2 rounded-btn border border-border px-3 py-1.5 text-[11px] font-bold text-text-1 hover:bg-bg disabled:opacity-40"
        >
          Перестроить черновик
        </button>
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => void confirm()}
        className="w-full rounded-btn bg-primary py-2.5 text-[12px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? '…' : 'Подтвердить и перейти к занятиям'}
      </button>
    </div>
  )
}
