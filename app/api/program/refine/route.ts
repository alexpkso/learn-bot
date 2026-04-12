import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createServerClientSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'

const anthropic = new Anthropic()

function parseJson(text: string): { modules: unknown[] } {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  return JSON.parse(trimmed) as { modules: unknown[] }
}

/** Уточнение черновика программы по текстовой просьбе ученика */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set' },
      { status: 500 }
    )
  }

  const supabase = createServerClientSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { request: string; programId?: string }

  const { data: program } = await supabase
    .from('programs')
    .select('id, modules, language')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program?.modules) {
    return NextResponse.json({ error: 'Черновик программы не найден' }, { status: 404 })
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `
Текущая программа (JSON):
${JSON.stringify(program.modules, null, 2)}

Просьба ученика:
${body.request}

Верни ТОЛЬКО обновлённый валидный JSON в том же форме:
{ "modules": [ ... ] }
Без markdown.
`.trim(),
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const text = textBlock?.type === 'text' ? textBlock.text : ''
  let parsed: { modules: unknown[] }
  try {
    parsed = parseJson(text)
  } catch {
    return NextResponse.json({ error: 'Не удалось разобрать ответ' }, { status: 502 })
  }

  const targetId = body.programId ?? program.id

  const { error } = await supabase
    .from('programs')
    .update({
      modules: parsed.modules,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ modules: parsed.modules })
}
