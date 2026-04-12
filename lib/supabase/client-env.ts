import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'

/** Только то, что видно в клиентском бандле (NEXT_PUBLIC_*). Для полной проверки см. формы с serverPublicEnv. */
export function isBrowserSupabaseConfigured(): boolean {
  return getSupabasePublicEnvOrNull() !== null
}
