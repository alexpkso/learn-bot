import { redirect } from 'next/navigation'
import Sidebar from '@/components/app/Sidebar'
import { createServerClientSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClientSupabase()
  if (!supabase) {
    redirect('/login?error=config')
  }

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
    console.error('[app layout] profiles:', profileError.message)
    redirect('/login?error=profile')
  }

  if (!profile?.onboarding_done) {
    redirect('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
