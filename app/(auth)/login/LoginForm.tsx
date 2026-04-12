'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  toAuthEmail,
  toLegacyInternalSyntheticEmail,
  toLegacySyntheticEmail,
} from '@/lib/auth/login-identifier'
import { isBrowserSupabaseConfigured } from '@/lib/supabase/client-env'
import { createClient } from '@/lib/supabase/client'

function safeNextPath(next: string): string {
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const urlError = searchParams.get('error')

  const envOk = useMemo(() => isBrowserSupabaseConfigured(), [])

  useEffect(() => {
    if (urlError !== 'config' || !envOk) return
    const u = new URL(window.location.href)
    u.searchParams.delete('error')
    const clean = u.pathname + (u.search ? u.search : '')
    router.replace(clean, { scroll: false })
  }, [urlError, envOk, router])

  const urlHint =
    urlError === 'config' && !envOk
      ? 'Сайт не настроен: не заданы переменные окружения на сервере. Обратитесь к администратору или выполните redeploy после настройки.'
      : urlError === 'profile'
        ? 'Не удалось загрузить профиль. Проверьте, что база данных развёрнута по инструкции в репозитории.'
        : urlError === 'auth'
          ? 'Вход по ссылке не сработал — используйте логин и пароль.'
          : null

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const authIdentifier = toAuthEmail(username)

    let authError = (
      await supabase.auth.signInWithPassword({
        email: authIdentifier,
        password,
      })
    ).error

    // Старые учётки — другие суффиксы синтетического адреса
    if (authError && !username.includes('@')) {
      authError = (
        await supabase.auth.signInWithPassword({
          email: toLegacySyntheticEmail(username),
          password,
        })
      ).error
    }
    if (authError && !username.includes('@')) {
      authError = (
        await supabase.auth.signInWithPassword({
          email: toLegacyInternalSyntheticEmail(username),
          password,
        })
      ).error
    }

    if (authError) {
      setError('Неверный логин или пароль')
      setLoading(false)
      return
    }

    const dest = safeNextPath(next)
    router.push(dest)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="rounded-card border border-border bg-white p-6 shadow-sm">
      <h1 className="text-center text-lg font-bold text-text-1">Language Lab</h1>
      <p className="mt-1 text-center text-[12px] text-text-2">Вход в систему</p>
      {urlHint && (
        <p className="mt-3 rounded-btn border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] leading-snug text-amber-900">
          {urlHint}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-2">Логин</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            className="mt-1 w-full rounded-btn border border-border px-3 py-2 font-mono text-[13px] outline-none ring-primary focus:ring-1"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-text-2">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
          />
        </div>
        {error && <p className="text-[12px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-btn bg-primary py-2 text-[12px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-text-2">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Регистрация
        </Link>
        {' · '}
        <Link href="/" className="text-primary hover:underline">
          На главную
        </Link>
      </p>
    </div>
  )
}
