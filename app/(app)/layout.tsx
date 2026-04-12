import { redirect } from 'next/navigation'
import Sidebar from '@/components/app/Sidebar'
import { createServerClientSupabase } from '@/lib/supabase/server'

export default async function AppLayout({
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

  if (!profile?.onboarding_done) redirect('/')

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
