'use client'

import { useLayoutEffect } from 'react'
import { setInjectedSupabasePublicEnv } from '@/lib/supabase/client'
import type { SupabasePublicEnv } from '@/lib/supabase/env'

/** Пробрасывает URL+ключ с сервера в createClient() для страниц без NEXT_PUBLIC в бандле. */
export function SupabaseEnvInjector({
  env,
  children,
}: {
  env: SupabasePublicEnv | null
  children: React.ReactNode
}) {
  useLayoutEffect(() => {
    setInjectedSupabasePublicEnv(env)
    return () => setInjectedSupabasePublicEnv(null)
  }, [env])

  return <>{children}</>
}
