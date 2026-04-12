/** Для клиентских форм: в сборке должны быть зашиты NEXT_PUBLIC_* (иначе createClient бросает). */
export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  )
}
