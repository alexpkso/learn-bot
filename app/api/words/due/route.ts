/**
 * GET /api/words/due?limit=20&topic=verb
 * Returns words due for review (next_review_at <= now).
 */
import { NextResponse } from 'next/server'
import { createServerClientSupabase, missingSupabaseConfigResponse } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? '20')
  const topic = searchParams.get('topic') // verb | noun | adjective | preposition | null = all

  let query = supabase
    .from('words')
    .select('*')
    .eq('user_id', user.id)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit)

  if (topic) query = query.eq('topic', topic)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ words: data ?? [] })
}
