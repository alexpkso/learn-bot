import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'

/** cookies() + Supabase — только динамический рендер */
export const dynamic = 'force-dynamic'

export default async function Home() {
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
    .select('onboarding, onboarding_done')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[home] profiles:', profileError.message)
    redirect('/login?error=profile')
  }

  if (!profile?.onboarding_done) {
    const ob = profile?.onboarding as Record<string, unknown> | null
    if (ob && typeof ob === 'object' && Object.keys(ob).length > 0) {
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('id, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!programError && program?.status === 'draft') {
        redirect('/onboarding/program')
      }
    }
    redirect('/onboarding')
  }

  redirect('/dashboard')
}
