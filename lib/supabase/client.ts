import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicEnvOrNull, type SupabasePublicEnv } from '@/lib/supabase/env'

let injectedPublicEnv: SupabasePublicEnv | null | undefined

/** См. components/supabase/SupabaseEnvInjector — env с сервера (SUPABASE_URL без NEXT_PUBLIC). */
export function setInjectedSupabasePublicEnv(env: SupabasePublicEnv | null) {
  injectedPublicEnv = env
}

function resolvePublicEnv(override?: SupabasePublicEnv | null): SupabasePublicEnv | null {
  if (override) return override
  if (injectedPublicEnv !== undefined) return injectedPublicEnv
  return getSupabasePublicEnvOrNull()
}

/**
 * Браузерный клиент.
 * @param serverPublicEnv — из Server Component (формы входа/регистрации).
 */
export function createClient(serverPublicEnv?: SupabasePublicEnv | null) {
  const env = resolvePublicEnv(serverPublicEnv ?? undefined)
  if (!env) {
    throw new Error(
      'Нет переменных Supabase или URL без https://. Нужны NEXT_PUBLIC_SUPABASE_URL и ключ anon (или SUPABASE_URL + SUPABASE_ANON_KEY на сервере).'
    )
  }

  return createBrowserClient(env.url, env.key)
}
