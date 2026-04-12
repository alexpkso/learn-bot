'use client'

import { useCallback, useRef, useState } from 'react'

export type WhisperStatus = 'idle' | 'recording' | 'processing'

/**
 * Запись в webm → POST /api/transcribe (OpenAI Whisper).
 */
export function useWhisperRecorder(whisperLang: string) {
  const [status, setStatus] = useState<WhisperStatus>('idle')
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const start = useCallback(
    async (onFinal: (text: string) => void | Promise<void>) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
      } catch {
        window.alert('Нужен доступ к микрофону.')
        return
      }

      const stream = streamRef.current
      if (!stream) return

      chunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      recRef.current = rec

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      rec.onerror = () => {
        releaseMic()
        setStatus('idle')
        recRef.current = null
      }

      rec.onstop = async () => {
        releaseMic()
        recRef.current = null
        setStatus('processing')
        try {
          const blob = new Blob(chunksRef.current, { type: mime })
          if (blob.size < 256) {
            setStatus('idle')
            await Promise.resolve(onFinal(''))
            return
          }
          const fd = new FormData()
          fd.append('audio', blob, 'speech.webm')
          fd.append('language', whisperLang)
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string }
            window.alert(j.error ?? 'Ошибка распознавания (Whisper)')
            setStatus('idle')
            await Promise.resolve(onFinal(''))
            return
          }
          const j = (await res.json()) as { text?: string }
          const text = (j.text ?? '').trim()
          await Promise.resolve(onFinal(text))
        } finally {
          setStatus('idle')
        }
      }

      rec.start(250)
      setStatus('recording')
    },
    [releaseMic, whisperLang]
  )

  return { status, start, stop }
}
