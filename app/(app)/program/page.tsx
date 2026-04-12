import { redirect } from 'next/navigation'
import { createServerClientSupabase } from '@/lib/supabase/server'
import type { ProgramModule } from '@/lib/types'

export default async function ProgramPage() {
  const supabase = createServerClientSupabase()
  if (!supabase) {
    redirect('/login?error=config')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: program } = await supabase
    .from('programs')
    .select('modules, status, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const modules = (program?.modules ?? []) as ProgramModule[]

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-[18px] font-bold text-text-1">Программа</h1>
        <p className="text-[12px] text-text-2">
          Подтверждённая программа. Чтобы изменить — пока через поддержку или новый аккаунт; позже
          добавим редактирование.
        </p>
      </div>

      {!modules.length ? (
        <p className="text-[13px] text-text-2">Программа не найдена.</p>
      ) : (
        <ul className="space-y-3">
          {modules.map((m) => (
            <li
              key={m.id}
              className="rounded-card border border-border bg-white p-3.5 text-[13px]"
            >
              <div className="text-[11px] font-black uppercase tracking-[0.05em] text-text-1">
                Модуль {m.id}: {m.title}
              </div>
              <p className="mt-1 leading-relaxed text-text-2">{m.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
