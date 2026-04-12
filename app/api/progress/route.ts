import { NextResponse } from 'next/server'
import {
  createServerClientSupabase,
  missingSupabaseConfigResponse,
} from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ progress: data })
}

export async function PATCH(req: Request) {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    current_module?: number
  }

  const { error } = await supabase
    .from('progress')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
