/** Публичные переменные Supabase (доступны в браузере и на сервере). */
export function getSupabasePublicEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !key) {
    throw new Error(
      'Отсутствуют NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY. Укажите их в Vercel → Settings → Environment Variables (Production) и сделайте Redeploy.'
    )
  }
  if (!url.startsWith('http')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL должен быть полным URL (начинаться с https://).'
    )
  }
  return { url, key }
}
