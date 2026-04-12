import {
  getSupabasePublishableKeyOrNull,
  normalizePublicSupabaseUrl,
} from '@/lib/supabase/env'

/** Для клиентских форм: в сборке должны быть зашиты NEXT_PUBLIC_* (иначе createClient бросает). */
export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(
    normalizePublicSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      getSupabasePublishableKeyOrNull()
  )
}
