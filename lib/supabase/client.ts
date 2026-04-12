import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKeyOrNull } from '@/lib/supabase/env'

/** Как в novoprint-accounting: createBrowserClient + trim; ключ publishable или anon. */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey = getSupabasePublishableKeyOrNull()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Нет переменных Supabase: NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (или NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
