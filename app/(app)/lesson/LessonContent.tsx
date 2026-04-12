'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import ChatWindow from '@/components/chat/ChatWindow'
import { useVoiceSession } from '@/lib/voice/useVoiceSession'
import type { ChatMessage } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function LessonContent() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const sessionType =
    typeParam === 'evening' ? 'evening' : ('morning' as const)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [targetLang, setTargetLang] = useState<'sr' | 'en'>('sr')

  const voiceLang = targetLang === 'en' ? 'en' : 'sr'
  const { status: voiceStatus, start, stop } = useVoiceSession(voiceLang)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_language')
        .eq('id', user.id)
        .single()
      if (!cancelled && profile?.target_language) {
        setTargetLang(profile.target_language === 'en' ? 'en' : 'sr')
      }
      const { data: prog } = await supabase
        .from('progress')
        .select('current_module')
        .eq('user_id', user.id)
        .single()
      const mod = prog?.current_module ?? 0
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: sessionType, module: mod }),
      })
      if (!res.ok || cancelled) return
      const j = (await res.json()) as { id: string }
      setSessionId(j.id)
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [sessionType])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || loading) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setDraft('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          sessionType,
          sessionId: sessionId ?? undefined,
        }),
      })
      const j = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Ошибка')
      if (j.reply) {
        setMessages((m) => [...m, { role: 'assistant', content: j.reply! }])
      }
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            e instanceof Error
              ? `Ошибка: ${e.message}`
              : 'Не удалось получить ответ.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [draft, loading, messages, sessionId, sessionType])

  function voiceLabel() {
    if (voiceStatus === 'recording') {
      return 'запись — нажмите микрофон ещё раз, чтобы вставить текст'
    }
    if (voiceStatus === 'processing') return 'обработка…'
    return 'idle'
  }

  function onMicToggle() {
    if (voiceStatus === 'recording') {
      stop()
      return
    }
    if (voiceStatus === 'idle') {
      void start((text) => {
        if (text)
          setDraft((prev) => (prev ? `${prev.trim()} ${text}` : text))
      })
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-4xl flex-col gap-3">
      <div>
        <h1 className="text-[18px] font-bold text-text-1">Занятие</h1>
        <p className="text-[12px] text-text-2">
          Режим: {sessionType === 'morning' ? 'утро (новое)' : 'вечер (повтор)'} ·{' '}
          <a className="text-primary underline" href="/lesson?type=morning">
            утро
          </a>{' '}
          ·{' '}
          <a className="text-primary underline" href="/lesson?type=evening">
            вечер
          </a>
        </p>
      </div>
      <ChatWindow
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSend={() => void send()}
        onMicToggle={onMicToggle}
        voiceLabel={voiceLabel()}
        loading={loading}
      />
    </div>
  )
}
