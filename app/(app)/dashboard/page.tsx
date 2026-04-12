import PecatBadge from '@/components/dashboard/PecatBadge'
import WordsDue from '@/components/dashboard/WordsDue'
import XPBar from '@/components/dashboard/XPBar'
import { createServerClientSupabase } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createServerClientSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [prog, words] = await Promise.all([
    supabase.from('progress').select('*').eq('user_id', user.id).single(),
    supabase
      .from('words')
      .select('serbian, russian')
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .limit(10),
  ])

  const xp = prog.data?.xp ?? 0
  const lastPecat = prog.data?.last_pecat ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-[18px] font-bold text-text-1">Дашборд</h1>
        <p className="mt-1 text-[12px] text-text-2">
          Модуль {prog.data?.current_module ?? 0} · загляните в «Занятие» для утра или вечера.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <XPBar xp={xp} />
        <PecatBadge lastPecat={lastPecat} />
      </div>
      <WordsDue words={words.data ?? []} />
    </div>
  )
}
