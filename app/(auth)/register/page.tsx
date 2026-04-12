import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'
import RegisterForm from './RegisterForm'

export default function RegisterPage() {
  const publicEnv = getSupabasePublicEnvOrNull()
  return <RegisterForm publicEnv={publicEnv} />
}
