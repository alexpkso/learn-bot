import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClientSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_done) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  )
}
