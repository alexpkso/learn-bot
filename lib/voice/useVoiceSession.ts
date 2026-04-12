'use client'

import { useCallback, useRef, useState } from 'react'

export type VoiceSessionStatus = 'idle' | 'recording' | 'processing'

const LANG_MAP: Record<'sr' | 'en' | 'ru', string> = {
  sr: 'sr-RS',
  en: 'en-US',
  ru: 'ru-RU',
}

/**
 * Схема как в docs/claude-voice-quick-order.md: getUserMedia → continuous SpeechRecognition
 * до явной остановки; итог — одна строка в поле чата.
 */
export function useVoiceSession(lang: 'sr' | 'en' | 'ru') {
  const [status, setStatus] = useState<VoiceSessionStatus>('idle')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const finalTranscriptRef = useRef('')

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(
    async (onFinal: (text: string) => void) => {
      if (typeof window === 'undefined') return
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) {
        window.alert('Распознавание речи недоступно. Используйте Chrome на десктопе.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
      } catch {
        window.alert('Нужен доступ к микрофону.')
        return
      }

      finalTranscriptRef.current = ''
      const recognition = new SR()
      recognition.lang = LANG_MAP[lang] ?? 'sr-RS'
      recognition.interimResults = true
      recognition.continuous = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => setStatus('recording')

      recognition.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          if (res.isFinal) {
            finalTranscriptRef.current += res[0].transcript
          }
        }
      }

      recognition.onerror = () => {
        releaseMic()
        setStatus('idle')
      }

      recognition.onend = () => {
        releaseMic()
        setStatus('processing')
        const text = finalTranscriptRef.current.trim()
        onFinal(text)
        setStatus('idle')
      }

      recognitionRef.current = recognition
      recognition.start()
    },
    [lang, releaseMic]
  )

  return { status, start, stop }
}
