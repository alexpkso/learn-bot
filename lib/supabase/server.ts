import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

export function createServerClientSupabase() {
  const { url, key } = getSupabasePublicEnv()
  const cookieStore = cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          /* Server Component — cookies read-only */
        }
      },
    },
  })
}
