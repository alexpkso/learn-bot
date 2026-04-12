/** Публичные переменные Supabase (доступны в браузере и на сервере). */

/**
 * Приводит NEXT_PUBLIC_SUPABASE_URL к виду, который принимает @supabase/supabase-js.
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
    // только host, без https:// (частая ошибка в Vercel)
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

/** Как в novoprint-accounting: publishable key; иначе классический anon key. */
export function getSupabasePublishableKeyOrNull(): string | null {
  let key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!key) return null
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim()
  }
  return key || null
}

export function getSupabasePublicEnvOrNull(): { url: string; key: string } | null {
  const url = normalizePublicSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = getSupabasePublishableKeyOrNull()
  if (!url || !key) return null
  return { url, key }
}
