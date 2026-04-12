import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'
import RegisterForm from './RegisterForm'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const publicEnv = getSupabasePublicEnvOrNull()
  return <RegisterForm publicEnv={publicEnv} />
}
