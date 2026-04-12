import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClientSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[onboarding layout] profiles:', profileError.message)
    redirect('/login?error=profile')
  }

  if (profile?.onboarding_done) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  )
}
