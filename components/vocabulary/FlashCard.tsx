'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw, Volume2 } from 'lucide-react'

export interface CardData {
  id: string
  word: string        // main word shown on front
  translation: string // shown on back
  topic: string
  extras: Record<string, string>
  status: string
  streak: number
}

interface Props {
  card: CardData
  onRate: (id: string, correct: boolean) => Promise<void>
  onSkip?: () => void
}

function VerbBack({ word, extras }: { word: string; extras: Record<string, string> }) {
  return (
    <div className="space-y-2 text-left">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <span className="text-text-2">Инфинитив (SR)</span>
        <span className="font-medium">{word}</span>
        <span className="text-text-2">Настоящее (1sg)</span>
        <span className="font-medium">{extras.sr_pres ?? '—'}</span>
        <span className="text-text-2">Прошедшее</span>
        <span className="font-medium">{extras.sr_perf ?? '—'}</span>
        <span className="text-text-2">English</span>
        <span className="font-medium text-blue-600">{extras.en_inf ?? '—'}</span>
        <span className="text-text-2">Past / P.P.</span>
        <span className="font-medium text-blue-600">{extras.en_past} / {extras.en_pp}</span>
      </div>
    </div>
  )
}

function NounBack({ word, extras }: { word: string; extras: Record<string, string> }) {
  const genderLabel: Record<string, string> = { m: 'мужской', f: 'женский', n: 'средний' }
  return (
    <div className="space-y-2 text-left">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <span className="text-text-2">Ед. ч. (SR)</span>
        <span className="font-medium">{word}</span>
        <span className="text-text-2">Мн. ч. (SR)</span>
        <span className="font-medium">{extras.sr_pl ?? '—'}</span>
        <span className="text-text-2">Род</span>
        <span className="font-medium">{genderLabel[extras.gender ?? ''] ?? extras.gender ?? '—'}</span>
        <span className="text-text-2">English</span>
        <span className="font-medium text-blue-600">{extras.en_sg} / {extras.en_pl}</span>
        <span className="text-text-2">Рус. мн. ч.</span>
        <span className="font-medium">{extras.ru_pl ?? '—'}</span>
      </div>
    </div>
  )
}

function AdjectiveBack({ word, extras }: { word: string; extras: Record<string, string> }) {
  return (
    <div className="space-y-2 text-left">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <span className="text-text-2">Муж. род</span>
        <span className="font-medium">{word}</span>
        <span className="text-text-2">Жен. род</span>
        <span className="font-medium">{extras.sr_f ?? '—'}</span>
        <span className="text-text-2">Ср. род</span>
        <span className="font-medium">{extras.sr_n ?? '—'}</span>
        <span className="text-text-2">English</span>
        <span className="font-medium text-blue-600">{extras.en ?? '—'}</span>
        {extras.antonym_sr && (
          <>
            <span className="text-text-2">Антоним</span>
            <span className="font-medium text-orange-600">{extras.antonym_sr} / {extras.antonym_en}</span>
          </>
        )}
      </div>
    </div>
  )
}

function PrepositionBack({ word, extras }: { word: string; extras: Record<string, string> }) {
  return (
    <div className="space-y-2 text-left">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <span className="text-text-2">Предлог (SR)</span>
        <span className="font-medium">{word}</span>
        <span className="text-text-2">English</span>
        <span className="font-medium text-blue-600">{extras.en ?? '—'}</span>
        <span className="text-text-2">Падеж</span>
        <span className="font-medium text-purple-600">{extras.cases ?? '—'}</span>
      </div>
      {extras.ex_sr && (
        <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-[12px]">
          <div className="font-medium text-blue-800">{extras.ex_sr}</div>
          <div className="text-blue-600">{extras.ex_ru}</div>
        </div>
      )}
    </div>
  )
}

const TOPIC_LABEL: Record<string, string> = {
  verb: 'Глагол', noun: 'Существительное', adjective: 'Прилагательное', preposition: 'Предлог',
}
const TOPIC_COLOR: Record<string, string> = {
  verb: 'bg-blue-50 text-blue-700', noun: 'bg-green-50 text-green-700',
  adjective: 'bg-purple-50 text-purple-700', preposition: 'bg-orange-50 text-orange-700',
}
const STATUS_COLOR: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600', learning: 'bg-yellow-50 text-yellow-700',
  learned: 'bg-green-50 text-green-700', problem: 'bg-red-50 text-red-600',
}

export default function FlashCard({ card, onRate, onSkip }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [rating, setRating] = useState<'correct' | 'wrong' | null>(null)

  async function handleRate(correct: boolean) {
    setRating(correct ? 'correct' : 'wrong')
    await onRate(card.id, correct)
  }

  function speak() {
    if (!window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(card.word)
    u.lang = 'sr-RS'
    window.speechSynthesis.speak(u)
  }

  const extras = card.extras ?? {}

  return (
    <div
      className={`relative w-full rounded-2xl border-2 transition-all duration-300 ${
        rating === 'correct' ? 'border-green-400 bg-green-50' :
        rating === 'wrong'   ? 'border-red-400 bg-red-50'   :
        'border-border bg-white'
      }`}
    >
      {/* Header badges */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${TOPIC_COLOR[card.topic] ?? 'bg-gray-100 text-gray-500'}`}>
          {TOPIC_LABEL[card.topic] ?? card.topic}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLOR[card.status] ?? ''}`}>
          {card.status} · {card.streak}🔥
        </span>
      </div>

      {/* Front */}
      <div className="flex flex-col items-center px-6 py-8">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-text-1">{card.word}</span>
          <button
            onClick={speak}
            className="rounded-full p-1 text-text-2 hover:bg-gray-100"
            title="Произнести"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
        <span className="mt-1 text-[12px] text-text-2">сербский / english → русский</span>

        {!flipped && (
          <button
            onClick={() => setFlipped(true)}
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-700"
          >
            Показать перевод
          </button>
        )}
      </div>

      {/* Back */}
      {flipped && (
        <div className="border-t border-border px-6 pb-6 pt-4">
          <div className="mb-3 text-center">
            <span className="text-xl font-bold text-green-700">{card.translation}</span>
          </div>

          {card.topic === 'verb'        && <VerbBack word={card.word} extras={extras} />}
          {card.topic === 'noun'        && <NounBack word={card.word} extras={extras} />}
          {card.topic === 'adjective'   && <AdjectiveBack word={card.word} extras={extras} />}
          {card.topic === 'preposition' && <PrepositionBack word={card.word} extras={extras} />}

          {/* Rating buttons */}
          {!rating && (
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => void handleRate(false)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-100"
              >
                <XCircle className="h-4 w-4" /> Не знаю
              </button>
              <button
                onClick={() => void handleRate(true)}
                className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-5 py-2.5 text-[13px] font-semibold text-green-700 transition hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4" /> Знаю!
              </button>
            </div>
          )}
          {rating && (
            <div className="mt-5 text-center text-[13px] font-semibold text-text-2">
              {rating === 'correct' ? '✅ Отлично! Следующая карточка…' : '❌ Запомним! Повторим позже…'}
            </div>
          )}
        </div>
      )}

      {/* Skip */}
      {onSkip && !rating && (
        <button
          onClick={onSkip}
          className="absolute right-3 top-3 rounded-md p-1 text-text-2 hover:bg-gray-100"
          title="Пропустить"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
