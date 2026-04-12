'use client'

import { useCallback, useRef, useState } from 'react'

export type BrowserSpeechStatus = 'idle' | 'recording' | 'processing'

const LANG_MAP: Record<'sr' | 'en' | 'ru', string> = {
  sr: 'sr-RS',
  en: 'en-US',
  ru: 'ru-RU',
}

/**
 * Как в novoprint-accounting (app/page.tsx): Web Speech API, ru-RU-стиль настроек —
 * interimResults: false, только финальные фразы, continuous до stop.
 */
export function useBrowserSpeech(lang: 'sr' | 'en' | 'ru') {
  const [status, setStatus] = useState<BrowserSpeechStatus>('idle')
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
    async (onFinal: (text: string) => void | Promise<void>) => {
      if (typeof window === 'undefined') return
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) {
        window.alert('Распознавание речи недоступно. Используйте Chrome / Edge.')
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
      recognition.interimResults = false
      recognition.continuous = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => setStatus('recording')

      recognition.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          if (res.isFinal) {
            const piece = res[0]?.transcript ?? ''
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + piece
          }
        }
      }

      recognition.onerror = (ev: Event) => {
        const err = (ev as SpeechRecognitionErrorEvent).error
        if (err !== 'aborted' && err !== 'not-allowed' && err !== 'audio-capture') {
          console.warn('[speech]', err)
        }
        releaseMic()
        setStatus('idle')
        recognitionRef.current = null
      }

      recognition.onend = () => {
        releaseMic()
        setStatus('processing')
        const text = finalTranscriptRef.current.trim()
        recognitionRef.current = null
        void Promise.resolve(onFinal(text)).finally(() => setStatus('idle'))
      }

      recognitionRef.current = recognition
      recognition.start()
    },
    [lang, releaseMic]
  )

  return { status, start, stop }
}
