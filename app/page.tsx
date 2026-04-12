import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createServerClientSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding, onboarding_done')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_done) {
    const ob = profile?.onboarding as Record<string, unknown> | null
    if (ob && typeof ob === 'object' && Object.keys(ob).length > 0) {
      const { data: program } = await supabase
        .from('programs')
        .select('id, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (program?.status === 'draft') {
        redirect('/onboarding/program')
      }
    }
    redirect('/onboarding')
  }

  redirect('/dashboard')
}
