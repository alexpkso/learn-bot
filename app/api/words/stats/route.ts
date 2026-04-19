/**
 * GET /api/words/stats
 * Returns counts by status and topic.
 */
import { NextResponse } from 'next/server'
import { createServerClientSupabase, missingSupabaseConfigResponse } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('words')
    .select('status, topic')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  const byStatus = { new: 0, learning: 0, learned: 0, problem: 0 }
  const byTopic: Record<string, number> = {}
  let due = 0
  const now = new Date()

  for (const r of rows) {
    byStatus[r.status as keyof typeof byStatus] = (byStatus[r.status as keyof typeof byStatus] ?? 0) + 1
    const t = r.topic ?? 'other'
    byTopic[t] = (byTopic[t] ?? 0) + 1
  }

  const { count } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', now.toISOString())

  due = count ?? 0

  return NextResponse.json({ total: rows.length, byStatus, byTopic, due })
}
