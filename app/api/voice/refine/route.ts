import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const MODEL = process.env.ANTHROPIC_VOICE_REFINE_MODEL ?? 'claude-haiku-4-5'

/**
 * Лёгкая пост-обработка текста (аналог идеи parse-voice в novoprint): исправить оговорки, склеить слова.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { text?: string; lang?: string }
  const text = body.text?.trim() ?? ''
  if (!text) return NextResponse.json({ text: '' })

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ text })
  }

  try {
    const lang = body.lang ?? 'ru'
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Ниже текст с голосового ввода на занятии по языку. Исправь явные ошибки распознавания, сохрани язык и смысл, не добавляй новых фактов. Язык ответа — как в оригинале (подсказка: ${lang}). Верни ТОЛЬКО исправленный текст, без кавычек и пояснений.

Текст:
${text}`,
        },
      ],
    })

    const block = response.content[0]
    const out = block.type === 'text' ? block.text.trim() : text
    return NextResponse.json({ text: out || text })
  } catch (e) {
    console.error('[voice/refine]', e)
    return NextResponse.json({ text }, { status: 200 })
  }
}
