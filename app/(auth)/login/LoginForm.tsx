'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function clientHasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const urlError = searchParams.get('error')

  const envOk = useMemo(() => clientHasSupabaseEnv(), [])

  /** Сообщение error=config часто «залипает» в URL после того, как переменные уже в билде — не пугаем зря */
  useEffect(() => {
    if (urlError !== 'config' || !envOk) return
    const u = new URL(window.location.href)
    u.searchParams.delete('error')
    const clean = u.pathname + (u.search ? u.search : '')
    router.replace(clean, { scroll: false })
  }, [urlError, envOk, router])

  const urlHint =
    urlError === 'config' && !envOk
      ? 'В сборке нет переменных Supabase. Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в Vercel (Production) и сделайте Redeploy.'
      : urlError === 'profile'
        ? 'Не удалось прочитать профиль. Выполните SQL-миграцию в Supabase (файл supabase/migrations/…init.sql).'
        : urlError === 'auth'
          ? 'Ошибка входа по ссылке — войдите через email и пароль.'
          : null

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    try {
      if (mode === 'register') {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() || 'Ученик' } },
        })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (err) throw err
      }
      const dest = next.startsWith('/') ? next : '/'
      router.push(dest)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-card border border-border bg-white p-6 shadow-sm">
      <h1 className="text-center text-lg font-bold text-text-1">Language Lab</h1>
      <p className="mt-1 text-center text-[12px] text-text-2">
        Вход по email и паролю. Подтверждение письма в Supabase можно отключить в настройках Auth.
      </p>
      {urlHint && (
        <p className="mt-3 rounded-btn border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] leading-snug text-amber-900">
          {urlHint}
        </p>
      )}

      <div className="mt-4 flex rounded-btn border border-border bg-bg p-0.5 text-[11px] font-semibold">
        <button
          type="button"
          className={`flex-1 rounded-[6px] py-1.5 ${
            mode === 'login' ? 'bg-white shadow-sm' : 'text-text-2'
          }`}
          onClick={() => setMode('login')}
        >
          Вход
        </button>
        <button
          type="button"
          className={`flex-1 rounded-[6px] py-1.5 ${
            mode === 'register' ? 'bg-white shadow-sm' : 'text-text-2'
          }`}
          onClick={() => setMode('register')}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
        {mode === 'register' && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-text-2">
              Имя
            </label>
            <input
              className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-2">
            E-mail
          </label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-2">
            Пароль
          </label>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </div>
        {error && <p className="text-[12px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-btn bg-primary py-2 text-[12px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-text-2">
        <Link href="/" className="text-primary hover:underline">
          На главную
        </Link>
      </p>
    </div>
  )
}
