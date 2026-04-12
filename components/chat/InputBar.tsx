'use client'

import { Mic, Send } from 'lucide-react'

type Props = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onMicToggle: () => void
  disabled?: boolean
}

export default function InputBar({
  value,
  onChange,
  onSend,
  onMicToggle,
  disabled,
}: Props) {
  return (
    <div className="flex items-end gap-2 border-t border-border bg-white p-3">
      <button
        type="button"
        title="Голос: первый клик — запись, второй — остановить и вставить в поле"
        onClick={onMicToggle}
        disabled={disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn border border-border text-primary hover:bg-primary-light disabled:opacity-40"
      >
        <Mic className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Напишите ответ или нажмите микрофон…"
        disabled={disabled}
        className="min-h-[40px] flex-1 resize-y rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text-1 outline-none ring-primary focus:ring-1 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-primary text-white hover:bg-blue-700 disabled:opacity-40"
      >
        <Send className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  )
}
