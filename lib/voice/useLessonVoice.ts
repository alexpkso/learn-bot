'use client'

import { useCallback, useEffect, useState } from 'react'
import { useBrowserSpeech } from '@/lib/voice/useBrowserSpeech'
import { useWhisperRecorder } from '@/lib/voice/useWhisperRecorder'

export type LessonVoiceEngine = 'whisper' | 'browser'

/**
 * Whisper (если OPENAI_API_KEY) — качество как в продакшен-STT; иначе Web Speech как в novoprint.
 * Опционально refine через Claude (ANTHROPIC_API_KEY), по смыслу как parse-voice после текста.
 */
export function useLessonVoice(targetLang: 'sr' | 'en') {
  const [engine, setEngine] = useState<LessonVoiceEngine | 'loading'>('loading')
  const [refine, setRefine] = useState(false)

  useEffect(() => {
    void fetch('/api/voice/config')
      .then((r) => r.json())
      .then((c: { whisper?: boolean; refine?: boolean }) => {
        setEngine(c.whisper ? 'whisper' : 'browser')
        setRefine(Boolean(c.refine))
      })
      .catch(() => {
        setEngine('browser')
        setRefine(false)
      })
  }, [])

  const speechLang: 'sr' | 'en' | 'ru' = targetLang === 'en' ? 'en' : 'sr'
  const whisperIso = targetLang === 'en' ? 'en' : 'sr'

  const browser = useBrowserSpeech(speechLang)
  const whisper = useWhisperRecorder(whisperIso)

  const maybeRefine = useCallback(
    async (text: string): Promise<string> => {
      const t = text.trim()
      if (!t || !refine) return t
      try {
        const res = await fetch('/api/voice/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: t, lang: whisperIso }),
        })
        if (!res.ok) return t
        const j = (await res.json()) as { text?: string }
        return ((j.text ?? t).trim() || t)
      } catch {
        return t
      }
    },
    [refine, whisperIso]
  )

  const wrapFinal = useCallback(
    (onFinal: (text: string) => void) => async (raw: string) => {
      const refined = await maybeRefine(raw)
      onFinal(refined)
    },
    [maybeRefine]
  )

  const status =
    engine === 'loading'
      ? 'idle'
      : engine === 'whisper'
        ? whisper.status
        : browser.status

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      if (engine === 'loading') return
      const run = wrapFinal(onFinal)
      if (engine === 'whisper') void whisper.start(run)
      else void browser.start(run)
    },
    [engine, whisper, browser, wrapFinal]
  )

  const stop = useCallback(() => {
    if (engine === 'whisper') whisper.stop()
    else if (engine === 'browser') browser.stop()
  }, [engine, whisper, browser])

  return {
    status,
    start,
    stop,
    engine: engine === 'loading' ? null : engine,
  }
}
