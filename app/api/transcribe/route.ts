import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Серверная транскрибация через OpenAI Whisper (качество лучше, чем Web Speech в Chrome).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY не задан. Добавьте ключ в Vercel или используйте браузерное распознавание.' },
      { status: 503 }
    )
  }

  try {
    const incoming = await req.formData()
    const audio = incoming.get('audio')
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'Нет аудио' }, { status: 400 })
    }

    const langRaw = incoming.get('language')
    const language = typeof langRaw === 'string' && langRaw.length >= 2 ? langRaw.slice(0, 2) : undefined

    const out = new FormData()
    out.append('model', 'whisper-1')
    out.append('file', audio, 'speech.webm')
    if (language) out.append('language', language)

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: out,
    })

    const raw = await r.text()
    if (!r.ok) {
      console.error('[transcribe]', r.status, raw)
      return NextResponse.json(
        { error: 'Ошибка Whisper API', detail: raw.slice(0, 200) },
        { status: 502 }
      )
    }

    const json = JSON.parse(raw) as { text?: string }
    return NextResponse.json({ text: (json.text ?? '').trim() })
  } catch (e) {
    console.error('[transcribe]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
