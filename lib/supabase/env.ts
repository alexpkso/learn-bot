/** Публичные переменные Supabase (браузер + сервер). */

function stripEnvQuotes(s: string | undefined): string | undefined {
  if (s == null) return undefined
  let t = s.trim().replace(/^\uFEFF/, '')
  if (!t) return undefined
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim()
  }
  return t || undefined
}

/**
 * URL проекта: сначала NEXT_PUBLIC (попадает в клиентский бандл), иначе SUPABASE_URL
 * (только на сервере — тогда передаём в формы через props).
 */
export function getRawSupabaseUrl(): string | undefined {
  return stripEnvQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
}

/**
 * Anon / publishable ключ: NEXT_PUBLIC_* или SUPABASE_ANON_KEY (на сервере).
 */
export function getRawSupabaseAnonKey(): string | undefined {
  return stripEnvQuotes(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY
  )
}

/**
 * Приводит URL к виду, который принимает @supabase/supabase-js.
 * Частые ошибки: только host без схемы, лишние кавычки из Vercel/.env, BOM.
 */
export function normalizePublicSupabaseUrl(raw: string | undefined | null): string | null {
  if (raw == null) return null
  let u = raw.trim().replace(/^\uFEFF/, '')
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim()
  }
  if (!u) return null

  if (!/^https?:\/\//i.test(u)) {
    if (/^[a-z0-9][a-z0-9.-]*\.supabase\.co$/i.test(u) || /^[a-z0-9][a-z0-9.-]*\.supabase\.com$/i.test(u)) {
      u = `https://${u}`
    } else {
      return null
    }
  }

  try {
    const parsed = new URL(u)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return u.replace(/\/+$/, '')
  } catch {
    return null
  }
}

export type SupabasePublicEnv = { url: string; key: string }

/** Единая точка: URL + ключ для createBrowserClient / middleware / API. */
export function getSupabasePublicEnvOrNull(): SupabasePublicEnv | null {
  const rawUrl = getRawSupabaseUrl()
  const rawKey = getRawSupabaseAnonKey()
  if (!rawUrl || !rawKey) return null
  const url = normalizePublicSupabaseUrl(rawUrl)
  if (!url) return null
  return { url, key: rawKey }
}

export function getSupabasePublishableKeyOrNull(): string | null {
  return getRawSupabaseAnonKey() ?? null
}
