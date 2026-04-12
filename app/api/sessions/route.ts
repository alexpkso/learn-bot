import { NextResponse } from 'next/server'
import { createServerClientSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClientSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('sessions')
    .select('id, type, module, pecat, xp_earned, summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createServerClientSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    type: 'morning' | 'evening'
    module: number
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      type: body.type,
      module: body.module,
      messages: [],
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
