import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import {
  createServerClientSupabase,
  missingSupabaseConfigResponse,
} from '@/lib/supabase/server'
import type { OnboardingPayload } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'

const anthropic = new Anthropic()

function parseJsonFromAssistant(text: string): { modules: unknown[] } {
  const trimmed = text.trim()
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  return JSON.parse(withoutFence) as { modules: unknown[] }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set' },
      { status: 500 }
    )
  }

  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { onboardingData } = (await req.json()) as {
    onboardingData: OnboardingPayload
  }

  const lang = onboardingData.language === 'sr' ? 'сербского' : 'английского'

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `
Создай персональную программу изучения ${lang} языка для взрослого ученика.

Контекст (от ученика, не выдумывай факты):
${JSON.stringify(onboardingData, null, 2)}

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "modules": [
    {
      "id": 0,
      "title": "...",
      "description": "...",
      "topics": ["..."],
      "vocabulary": [{"sr": "...", "ru": "..."}],
      "situations": ["..."],
      "estimated_days": 5
    }
  ]
}

Для английского в полях vocabulary используй ключ "sr" для английского слова/фразы (ключ остаётся "sr" для совместимости с БД), перевод на русский — в "ru".
`.trim(),
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const text = textBlock?.type === 'text' ? textBlock.text : ''
  let program: { modules: unknown[] }
  try {
    program = parseJsonFromAssistant(text)
  } catch {
    return NextResponse.json(
      { error: 'Не удалось разобрать JSON программы. Попробуйте ещё раз.' },
      { status: 502 }
    )
  }

  const { error } = await supabase.from('programs').insert({
    user_id: user.id,
    language: onboardingData.language,
    modules: program.modules,
    status: 'draft',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ modules: program.modules })
}
