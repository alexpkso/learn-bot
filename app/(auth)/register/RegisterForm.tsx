'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mapSignUpApiError, mapThrownAuthError } from '@/lib/auth/auth-form-errors'
import { toAuthEmail } from '@/lib/auth/login-identifier'
import { isBrowserSupabaseConfigured } from '@/lib/supabase/client-env'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const envOk = useMemo(() => isBrowserSupabaseConfigured(), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (!envOk) {
      setError(
        'В этой сборке не заданы переменные Supabase. Укажите их в Vercel и выполните новый деплой.'
      )
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const authIdentifier = toAuthEmail(username)
      const loginPart = username.trim().toLowerCase().split('@')[0] || 'Ученик'

      const { data, error: err } = await supabase.auth.signUp({
        email: authIdentifier,
        password,
        options: {
          data: { name: loginPart },
        },
      })

      if (err) {
        const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : undefined
        setError(mapSignUpApiError(err.message, code))
        return
      }

      if (!data.session) {
        setInfo(
          'Аккаунт создан. Перейдите на страницу «Вход» и войдите с тем же логином и паролем.'
        )
        return
      }

      router.push('/')
      router.refresh()
    } catch (e: unknown) {
      setError(mapThrownAuthError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-card border border-border bg-white p-6 shadow-sm">
      <h1 className="text-center text-lg font-bold text-text-1">Регистрация</h1>
      <p className="mt-1 text-center text-[12px] text-text-2">
        Придумайте логин и пароль — только они нужны для входа в приложение.
      </p>

      {!envOk && (
        <p className="mt-3 rounded-btn border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] leading-snug text-amber-900">
          Не заданы переменные окружения Supabase в сборке. Проверьте Vercel → Settings → Environment
          Variables (NEXT_PUBLIC_SUPABASE_URL и ключ).
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
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-btn border border-border px-3 py-2 text-[13px] outline-none ring-primary focus:ring-1"
          />
        </div>
        {info && (
          <p className="rounded-btn border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] text-amber-900">
            {info}
          </p>
        )}
        {error && <p className="text-[12px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !envOk}
          className="w-full rounded-btn bg-primary py-2 text-[12px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-text-2">
        <Link href="/login" className="text-primary hover:underline">
          Уже есть аккаунт — войти
        </Link>
      </p>
    </div>
  )
}
