/** Публичные переменные Supabase (доступны в браузере и на сервере). */

export function getSupabasePublicEnvOrNull(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return null
  if (!url.startsWith('http')) return null
  return { url, key }
}
