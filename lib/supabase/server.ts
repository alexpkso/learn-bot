import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'

/** Ответ 500 для Route Handlers, если не заданы переменные Supabase */
export function missingSupabaseConfigResponse() {
  return NextResponse.json(
    {
      error:
        'Сервер не настроен: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (или ANON_KEY) в Vercel и выполните Redeploy.',
    },
    { status: 500 }
  )
}

/**
 * Клиент для Server Components и Route Handlers.
 * Если переменные окружения не заданы — возвращает `null` (не бросает исключение).
 * В Route Handlers нельзя полагаться на throw: иначе 500 и error boundary.
 */
export function createServerClientSupabase(): SupabaseClient | null {
  const env = getSupabasePublicEnvOrNull()
  if (!env) return null

  const { url, key } = env
  const cookieStore = cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          /* Server Component — cookies read-only */
        }
      },
    },
  })
}
