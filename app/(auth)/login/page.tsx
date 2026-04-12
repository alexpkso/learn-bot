import { Suspense } from 'react'
import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'
import LoginForm from './LoginForm'

export default function LoginPage() {
  const publicEnv = getSupabasePublicEnvOrNull()
  return (
    <Suspense
      fallback={
        <div className="rounded-card border border-border bg-white p-6 text-center text-[13px] text-text-2 shadow-sm">
          Загрузка…
        </div>
      }
    >
      <LoginForm publicEnv={publicEnv} />
    </Suspense>
  )
}
