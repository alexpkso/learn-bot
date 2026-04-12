import { NextResponse } from 'next/server'
import {
  createServerClientSupabase,
  missingSupabaseConfigResponse,
} from '@/lib/supabase/server'
import { getNextReviewDate, getNextStatus } from '@/lib/words/spaced-repetition'

export async function GET() {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', user.id)
    .order('next_review_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ words: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    serbian: string
    russian: string
    topic?: string
  }

  const { data, error } = await supabase
    .from('words')
    .insert({
      user_id: user.id,
      serbian: body.serbian.trim(),
      russian: body.russian.trim(),
      topic: body.topic ?? null,
      next_review_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: Request) {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    id: string
    correct?: boolean
    status?: string
  }

  const { data: row, error: fetchErr } = await supabase
    .from('words')
    .select('*')
    .eq('id', body.id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const correct = body.correct ?? true
  const newStreak = correct ? (row.streak ?? 0) + 1 : 0
  const status = body.status ?? getNextStatus(row.status, newStreak, correct)
  const nextAt = getNextReviewDate(status, newStreak, correct)

  const { error } = await supabase
    .from('words')
    .update({
      status,
      streak: newStreak,
      next_review_at: nextAt.toISOString(),
      error_count: correct ? row.error_count : (row.error_count ?? 0) + 1,
    })
    .eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
