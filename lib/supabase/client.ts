import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKeyOrNull, normalizePublicSupabaseUrl } from '@/lib/supabase/env'

/** Как в novoprint-accounting: createBrowserClient + trim; ключ publishable или anon. */
export function createClient() {
  const supabaseUrl = normalizePublicSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey = getSupabasePublishableKeyOrNull()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Нет переменных Supabase или URL без https://. Задайте NEXT_PUBLIC_SUPABASE_URL вида https://xxxx.supabase.co и ключ (anon или publishable).'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
