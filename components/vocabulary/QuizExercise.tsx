'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export type ExerciseType = 'translate_sr_ru' | 'translate_ru_sr' | 'multiple_choice' | 'fill_blank'

export interface QuizWord {
  id: string
  word: string        // serbian (main)
  translation: string // russian
  topic: string
  extras: Record<string, string>
}

interface TranslateProps {
  word: QuizWord
  type: 'sr_ru' | 'ru_sr'
  onResult: (correct: boolean) => void
}

function TranslateExercise({ word, type, onResult }: TranslateProps) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [correct, setCorrect] = useState('')

  const question = type === 'sr_ru' ? word.word : word.translation
  const answer   = type === 'sr_ru' ? word.translation : word.word
  const hint     = type === 'sr_ru' ? 'Переведи на русский' : 'Переведи на сербский'

  function check() {
    const normalise = (s: string) =>
      s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;]/g, '')
    const isCorrect = normalise(input) === normalise(answer)
    setCorrect(answer)
    setResult(isCorrect)
    onResult(isCorrect)
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-2">{hint}</div>
      <div className="rounded-xl bg-gray-50 px-5 py-4 text-center">
        <span className="text-2xl font-bold text-text-1">{question}</span>
        {word.topic === 'preposition' && word.extras.cases && (
          <div className="mt-1 text-[11px] text-purple-600">{word.extras.cases}</div>
        )}
      </div>
      <input
        className="w-full rounded-xl border border-border px-4 py-3 text-[14px] text-text-1 focus:border-primary focus:outline-none"
        placeholder="Введи перевод…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !result) check() }}
        disabled={result !== null}
        autoFocus
      />
      {result === null && (
        <button
          onClick={check}
          disabled={!input.trim()}
          className="w-full rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Проверить
        </button>
      )}
      {result !== null && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-medium ${result ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result ? (
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Правильно!</span>
          ) : (
            <span className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Правильный ответ: <strong>{correct}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

interface MultipleChoiceProps {
  word: QuizWord
  allWords: QuizWord[]
  onResult: (correct: boolean) => void
}

function MultipleChoice({ word, allWords, onResult }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)

  // Build 4 options: correct + 3 random distractors from same topic
  const distractors = allWords
    .filter(w => w.id !== word.id && w.topic === word.topic)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.translation)

  const options = [...distractors, word.translation].sort(() => Math.random() - 0.5)

  function pick(opt: string) {
    if (selected) return
    setSelected(opt)
    onResult(opt === word.translation)
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-2">Выбери перевод</div>
      <div className="rounded-xl bg-gray-50 px-5 py-4 text-center">
        <span className="text-2xl font-bold text-text-1">{word.word}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          const isCorrect = opt === word.translation
          const isPicked  = opt === selected
          let cls = 'rounded-xl border px-4 py-3 text-[13px] font-medium transition text-left '
          if (!selected)  cls += 'border-border bg-white hover:border-primary hover:bg-primary-light cursor-pointer'
          else if (isCorrect) cls += 'border-green-400 bg-green-50 text-green-700'
          else if (isPicked)  cls += 'border-red-400 bg-red-50 text-red-600'
          else cls += 'border-border bg-white opacity-50'
          return (
            <button key={opt} onClick={() => pick(opt)} className={cls}>
              {opt}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className={`rounded-xl px-4 py-2.5 text-[13px] font-medium ${selected === word.translation ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {selected === word.translation ? '✅ Правильно!' : `❌ Правильный ответ: ${word.translation}`}
        </div>
      )}
    </div>
  )
}

interface FillBlankProps {
  word: QuizWord
  onResult: (correct: boolean) => void
}

function FillBlank({ word, onResult }: FillBlankProps) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<boolean | null>(null)

  // Build a sentence with a blank
  let sentence = ''
  let answer = ''

  if (word.topic === 'preposition' && word.extras.ex_sr) {
    const sr = word.extras.ex_sr
    const srWord = word.word
    sentence = sr.replace(srWord, '___')
    answer = srWord
  } else if (word.topic === 'verb' && word.extras.sr_pres) {
    sentence = `Ja ___ svaki dan. (${word.extras.en_inf})`
    answer = word.extras.sr_pres
  } else if (word.topic === 'noun') {
    sentence = `Vidim jednog/jednu ___. (${word.extras.en_sg ?? word.word})`
    answer = word.word
  } else {
    sentence = `___ — это «${word.translation}».`
    answer = word.word
  }

  function check() {
    const norm = (s: string) => s.trim().toLowerCase()
    const ok = norm(input) === norm(answer)
    setResult(ok)
    onResult(ok)
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-2">Заполни пропуск</div>
      <div className="rounded-xl bg-gray-50 px-5 py-4 text-center">
        <span className="text-xl font-medium text-text-1">{sentence}</span>
        {word.extras.ex_ru && word.topic === 'preposition' && (
          <div className="mt-2 text-[12px] text-text-2 italic">{word.extras.ex_ru}</div>
        )}
      </div>
      <input
        className="w-full rounded-xl border border-border px-4 py-3 text-[14px] text-text-1 focus:border-primary focus:outline-none"
        placeholder="Введи слово…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !result) check() }}
        disabled={result !== null}
        autoFocus
      />
      {result === null && (
        <button
          onClick={check}
          disabled={!input.trim()}
          className="w-full rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Проверить
        </button>
      )}
      {result !== null && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-medium ${result ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result ? '✅ Правильно!' : <span>❌ Правильный ответ: <strong>{answer}</strong></span>}
        </div>
      )}
    </div>
  )
}

// ─── Main QuizExercise ───────────────────────────────────────────────────────

interface QuizProps {
  words: QuizWord[]
  onFinish: (correct: number, total: number) => void
}

const EXERCISE_TYPES: ExerciseType[] = ['translate_sr_ru', 'translate_ru_sr', 'multiple_choice', 'fill_blank']

function pickType(word: QuizWord, idx: number): ExerciseType {
  // Rotate through types; for prepositions prefer fill_blank
  if (word.topic === 'preposition' && idx % 3 === 0) return 'fill_blank'
  if (word.topic === 'verb' && idx % 2 === 0) return 'fill_blank'
  return EXERCISE_TYPES[idx % 3]!
}

export default function QuizExercise({ words, onFinish }: QuizProps) {
  const [idx, setIdx]       = useState(0)
  const [correct, setCorrect] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [done, setDone]     = useState(false)

  const word    = words[idx]
  const exType  = word ? pickType(word, idx) : 'translate_sr_ru'
  const total   = words.length

  const handleResult = useCallback((ok: boolean) => {
    if (ok) setCorrect(c => c + 1)
    setAnswered(true)
    setTimeout(() => {
      if (idx + 1 >= total) {
        setDone(true)
        onFinish(ok ? correct + 1 : correct, total)
      } else {
        setIdx(i => i + 1)
        setAnswered(false)
      }
    }, 1400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, total, correct, onFinish])

  if (!word || done) return null

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-[12px] text-text-2">
        <span>{idx + 1} / {total}</span>
        <span className="font-semibold text-green-600">{correct} верно</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Exercise */}
      <div className="rounded-2xl border border-border bg-white p-5">
        {exType === 'translate_sr_ru' && <TranslateExercise word={word} type="sr_ru" onResult={handleResult} />}
        {exType === 'translate_ru_sr' && <TranslateExercise word={word} type="ru_sr" onResult={handleResult} />}
        {exType === 'multiple_choice' && <MultipleChoice word={word} allWords={words} onResult={handleResult} />}
        {exType === 'fill_blank'      && <FillBlank word={word} onResult={handleResult} />}
      </div>
    </div>
  )
}
