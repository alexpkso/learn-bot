import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Клиент выбирает движок: Whisper (нужен OPENAI_API_KEY) или Web Speech API. */
export async function GET() {
  return NextResponse.json({
    whisper: Boolean(process.env.OPENAI_API_KEY?.trim()),
    refine: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  })
}
