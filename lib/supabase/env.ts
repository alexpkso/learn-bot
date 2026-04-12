/** Публичные переменные Supabase (доступны в браузере и на сервере). */

/** Как в novoprint-accounting: publishable key; иначе классический anon key. */
export function getSupabasePublishableKeyOrNull(): string | null {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return key || null
}

export function getSupabasePublicEnvOrNull(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = getSupabasePublishableKeyOrNull()
  if (!url || !key) return null
  if (!url.startsWith('http')) return null
  return { url, key }
}
