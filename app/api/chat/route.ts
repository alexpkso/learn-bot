import Anthropic from '@anthropic-ai/sdk'
import type {
  Message,
  MessageParam,
  TextBlock,
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages'
import { NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/claude/system-prompt'
import { claudeTools } from '@/lib/claude/tools'
import { buildLearnerNotes } from '@/lib/onboarding/buildLearnerNotes'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createServerClientSupabase,
  missingSupabaseConfigResponse,
} from '@/lib/supabase/server'
import { getNextReviewDate, getNextStatus } from '@/lib/words/spaced-repetition'
import type { OnboardingPayload, WordStatus } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'

const anthropic = new Anthropic()

function extractText(msg: Message): string {
  return msg.content
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

async function applyTool(
  block: ToolUseBlock,
  userId: string,
  supabase: SupabaseClient
) {
  const input = block.input as Record<string, unknown>

  if (block.name === 'update_progress') {
    const xpDelta = Number(input.xp_delta ?? 0)
    const pecatRaw = input.pecat
    const pecat =
      typeof pecatRaw === 'number' && pecatRaw >= 1 && pecatRaw <= 5 ? pecatRaw : null

    const { data: prog } = await supabase
      .from('progress')
      .select('xp, last_pecat')
      .eq('user_id', userId)
      .single()

    const newXp = Math.max(0, (prog?.xp ?? 0) + xpDelta)
    const upd: Record<string, unknown> = {
      xp: newXp,
      updated_at: new Date().toISOString(),
    }
    if (pecat != null) upd.last_pecat = pecat

    await supabase.from('progress').update(upd).eq('user_id', userId)
    return { ok: true as const }
  }

  if (block.name === 'update_word_status') {
    const serbian = String(input.serbian ?? '').trim()
    const correct = Boolean(input.correct)
    const requested = String(input.new_status ?? 'new') as WordStatus

    const { data: words } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)

    const w = words?.find(
      (x) => x.serbian.toLowerCase().trim() === serbian.toLowerCase().trim()
    )
    if (!w) return { ok: false as const, error: 'word_not_found' }

    const newStreak = correct ? (w.streak ?? 0) + 1 : 0
    const status = ['new', 'learning', 'learned', 'problem'].includes(requested)
      ? requested
      : getNextStatus(w.status, newStreak, correct)
    const nextAt = getNextReviewDate(status, newStreak, correct)

    await supabase
      .from('words')
      .update({
        status,
        streak: newStreak,
        next_review_at: nextAt.toISOString(),
        error_count: correct ? w.error_count : (w.error_count ?? 0) + 1,
      })
      .eq('id', w.id)

    return { ok: true as const }
  }

  return { ok: false as const, error: 'unknown_tool' }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set' },
      { status: 500 }
    )
  }

  const body = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    sessionType: 'morning' | 'evening'
    sessionId?: string
  }

  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profileRes, progressRes, wordsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('progress').select('*').eq('user_id', user.id).single(),
    supabase
      .from('words')
      .select('serbian, russian')
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .limit(12),
  ])

  const profile = profileRes.data
  const onboarding = profile?.onboarding as OnboardingPayload | null | undefined

  const learnerNotes =
    onboarding && typeof onboarding === 'object' && 'goal' in onboarding
      ? buildLearnerNotes(onboarding)
      : 'Контекст ученика пока минимальный — уточни цели в начале диалога.'

  const ctx = {
    name: profile?.name ?? 'Ученик',
    targetLanguage: (profile?.target_language as 'sr' | 'en') ?? 'sr',
    nativeLanguage: profile?.native_language ?? 'ru',
    xp: progressRes.data?.xp ?? 0,
    currentModule: progressRes.data?.current_module ?? 0,
    lastPecat: progressRes.data?.last_pecat ?? 0,
    sessionType: body.sessionType,
    wordsDue: wordsRes.data ?? [],
    learnerNotes,
  }

  const system = buildSystemPrompt(ctx)

  const incoming: MessageParam[] = (body.messages ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let messages: MessageParam[] = incoming
  let lastAssistantText = ''
  const maxRounds = 6

  for (let round = 0; round < maxRounds; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages,
      tools: claudeTools,
    })

    const toolUses = response.content.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUses.length === 0) {
      lastAssistantText = extractText(response)
      break
    }

    const toolResultBlocks: ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      const result = await applyTool(tu, user.id, supabase)
      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      })
    }

    messages = [
      ...messages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResultBlocks },
    ]
  }

  if (!lastAssistantText) {
    return NextResponse.json(
      { error: 'Пустой ответ модели. Попробуйте ещё раз.' },
      { status: 502 }
    )
  }

  const fullChat = [
    ...body.messages,
    { role: 'assistant' as const, content: lastAssistantText },
  ]

  if (body.sessionId) {
    await supabase
      .from('sessions')
      .update({
        messages: fullChat,
        summary: lastAssistantText.slice(0, 400),
      })
      .eq('id', body.sessionId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({
    reply: lastAssistantText,
    sessionId: body.sessionId ?? null,
  })
}
