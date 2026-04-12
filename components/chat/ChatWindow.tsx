'use client'

import MessageBubble from '@/components/chat/MessageBubble'
import InputBar from '@/components/chat/InputBar'
import type { ChatMessage } from '@/lib/types'

type Props = {
  messages: ChatMessage[]
  draft: string
  onDraftChange: (v: string) => void
  onSend: () => void
  onMicToggle: () => void
  voiceLabel: string
  loading?: boolean
}

export default function ChatWindow({
  messages,
  draft,
  onDraftChange,
  onSend,
  onMicToggle,
  voiceLabel,
  loading,
}: Props) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col rounded-card border border-border bg-white">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-[13px] text-text-2">
            Начните с приветствия или ответа на первый вопрос учителя.
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <p className="text-[12px] text-text-2">Учитель пишет…</p>
        )}
      </div>
      <div className="relative">
        {voiceLabel !== 'idle' && (
          <div className="border-t border-border bg-bg px-3 py-1 text-[10px] text-text-2">
            Голос: {voiceLabel}
          </div>
        )}
        <InputBar
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
          onMicToggle={onMicToggle}
          disabled={loading}
        />
      </div>
    </div>
  )
}
