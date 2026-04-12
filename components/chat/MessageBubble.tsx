'use client'

type Props = { role: 'user' | 'assistant'; content: string }

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[min(720px,92%)] rounded-card border px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? 'border-primary/25 bg-primary-light text-text-1'
            : 'border-border bg-white text-text-1'
        }`}
      >
        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
          {isUser ? 'Вы' : 'Учитель'}
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  )
}
