'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING_STEPS } from '@/lib/onboarding/questions'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingPayload, TargetLanguage } from '@/lib/types'

function initialForm(): Record<string, string | number> {
  const o: Record<string, string | number> = {}
  for (const s of ONBOARDING_STEPS) {
    if (s.type === 'select' && s.options?.length) {
      o[s.id] = s.options[0].value
    } else {
      o[s.id] = ''
    }
  }
  return o
}

export default function OnboardingWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Record<string, string | number>>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1

  const progress = useMemo(
    () => Math.round(((step + 1) / ONBOARDING_STEPS.length) * 100),
    [step]
  )

  function setField(id: string, v: string | number) {
    setForm((f) => ({ ...f, [id]: v }))
  }

  function validateStep(): boolean {
    if (current.optional) return true
    const v = form[current.id]
    if (v === '' || v === undefined) {
      setError('Заполните поле')
      return false
    }
    return true
  }

  async function finish() {
    setError(null)
    setLoading(true)
    try {
      const payload: OnboardingPayload = {
        name: String(form.name ?? '').trim(),
        native_language: String(form.native_language ?? 'ru'),
        language: String(form.language) as TargetLanguage,
        level: String(form.level),
        goal: String(form.goal ?? '').trim(),
        context: String(form.context ?? '').trim(),
        time: Number(form.time) || 30,
        priorities: form.priorities ? String(form.priorities) : undefined,
        blockers: form.blockers ? String(form.blockers) : undefined,
        practice_style: form.practice_style
          ? String(form.practice_style)
          : undefined,
      }

      if (!payload.name) throw new Error('Укажите имя')

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Нет сессии')

      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          name: payload.name,
          native_language: payload.native_language,
          target_language: payload.language,
          onboarding: payload,
        })
        .eq('id', user.id)

      if (upErr) throw upErr

      const res = await fetch('/api/program/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingData: payload }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? 'Не удалось сгенерировать программу')
      }

      router.push('/onboarding/program')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  function next() {
    setError(null)
    if (!validateStep()) return
    if (isLast) void finish()
    else setStep((s) => s + 1)
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <div className="rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-[0.05em] text-text-1">
          Знакомство
        </span>
        <span className="text-[10px] text-text-2">{progress}%</span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h1 className="text-[15px] font-bold leading-snug text-text-1">
        {current.question}
      </h1>

      <div className="mt-4 space-y-3">
        {current.type === 'text' && (
          <input
            className="w-full rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
            value={String(form[current.id] ?? '')}
            onChange={(e) => setField(current.id, e.target.value)}
            placeholder={current.placeholder}
          />
        )}
        {current.type === 'textarea' && (
          <textarea
            rows={5}
            className="w-full resize-y rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
            value={String(form[current.id] ?? '')}
            onChange={(e) => setField(current.id, e.target.value)}
            placeholder={current.placeholder}
          />
        )}
        {current.type === 'select' && current.options && (
          <select
            className="w-full rounded-btn border border-border bg-white px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
            value={String(form[current.id] ?? '')}
            onChange={(e) => {
              const opt = current.options?.find((o) => String(o.value) === e.target.value)
              setField(current.id, opt ? opt.value : e.target.value)
            }}
          >
            {current.options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || loading}
          className="rounded-btn border border-border px-4 py-2 text-[11px] font-bold text-text-2 hover:bg-bg disabled:opacity-40"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={next}
          disabled={loading}
          className="ml-auto rounded-btn bg-primary px-4 py-2 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '…' : isLast ? 'Создать программу' : 'Далее'}
        </button>
      </div>
    </div>
  )
}
