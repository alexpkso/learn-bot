'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { BookOpen, BrainCircuit, List, Plus, X } from 'lucide-react'
import VocabStats from '@/components/vocabulary/VocabStats'
import WordTable from '@/components/vocabulary/WordTable'

// Lazy-load heavy components
const FlashcardSession = dynamic(() => import('@/components/vocabulary/FlashcardSession'), { ssr: false })
const QuizExercise     = dynamic(() => import('@/components/vocabulary/QuizExercise'), { ssr: false })

type Tab = 'list' | 'flashcards' | 'quiz' | 'add'
type QuizTopic = 'all' | 'verb' | 'noun' | 'adjective' | 'preposition'

const QUIZ_TOPIC_LABEL: Record<QuizTopic, string> = {
  all: 'Всё', verb: 'Глаголы', noun: 'Существительные',
  adjective: 'Прилагательные', preposition: 'Предлоги',
}

function AddWordPanel({ onAdded }: { onAdded: () => void }) {
  const [serbian, setSerbian] = useState('')
  const [russian, setRussian] = useState('')
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!serbian.trim() || !russian.trim()) return
    setSaving(true)
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serbian: serbian.trim(), russian: russian.trim() }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg('Слово добавлено!')
      setSerbian('')
      setRussian('')
      onAdded()
    } else {
      setMsg('Ошибка')
    }
  }

  return (
    <form onSubmit={e => void save(e)} className="space-y-3 rounded-2xl border border-border bg-white p-5">
      <h3 className="text-[14px] font-bold text-text-1">Добавить своё слово</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-2">Сербский / English</label>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[13px] focus:border-primary focus:outline-none"
            placeholder="npr. dobar"
            value={serbian}
            onChange={e => setSerbian(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-2">Русский</label>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[13px] focus:border-primary focus:outline-none"
            placeholder="хороший"
            value={russian}
            onChange={e => setRussian(e.target.value)}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? 'Сохранение…' : 'Добавить'}
      </button>
      {msg && <p className="text-[12px] text-text-2">{msg}</p>}
    </form>
  )
}

// Quiz launcher
function QuizLauncher({ onStart }: { onStart: (topic: QuizTopic, count: number) => void }) {
  const [topic, setTopic]   = useState<QuizTopic>('all')
  const [count, setCount]   = useState(10)

  return (
    <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
      <h3 className="text-[14px] font-bold text-text-1">Настроить упражнение</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-2">Тема</label>
          <select
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[13px] focus:border-primary focus:outline-none"
            value={topic}
            onChange={e => setTopic(e.target.value as QuizTopic)}
          >
            {(Object.entries(QUIZ_TOPIC_LABEL) as [QuizTopic, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-2">Кол-во слов</label>
          <select
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-[13px] focus:border-primary focus:outline-none"
            value={count}
            onChange={e => setCount(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <button
        onClick={() => onStart(topic, count)}
        className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700"
      >
        Начать тест
      </button>
    </div>
  )
}

interface QuizWord {
  id: string; word: string; translation: string; topic: string; extras: Record<string, string>
}

export default function VocabularyPage() {
  const [tab, setTab]           = useState<Tab>('list')
  const [refresh, setRefresh]   = useState(0)
  const [quizWords, setQuizWords] = useState<QuizWord[] | null>(null)
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null)
  const [flashTopic, setFlashTopic] = useState<string>('all')

  const reload = () => setRefresh(r => r + 1)

  async function startQuiz(topic: QuizTopic, count: number) {
    const url = `/api/words/due?limit=${count * 3}${topic !== 'all' ? `&topic=${topic}` : ''}`
    const res = await fetch(url)
    if (!res.ok) return
    const j = (await res.json()) as { words: { id: string; serbian: string; russian: string; topic: string; extras: string | null }[] }
    const words: QuizWord[] = (j.words ?? []).slice(0, count).map(w => ({
      id: w.id,
      word: w.serbian,
      translation: w.russian,
      topic: w.topic ?? 'other',
      extras: w.extras ? (JSON.parse(w.extras) as Record<string, string>) : {},
    }))
    setQuizWords(words)
    setQuizResult(null)
  }

  const TAB_BTN = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      key={t}
      onClick={() => { setTab(t); setQuizWords(null); setQuizResult(null) }}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition ${
        tab === t ? 'bg-primary text-white' : 'bg-white border border-border text-text-2 hover:bg-gray-50'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[18px] font-bold text-text-1">Словарь</h1>
        <p className="text-[12px] text-text-2">
          912 слов · интервальное повторение (SM-2) · глаголы, существительные, прилагательные, предлоги
        </p>
      </div>

      {/* Stats + import */}
      <VocabStats onImportDone={reload} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TAB_BTN('list',       <List className="h-3.5 w-3.5" />,        'Список')}
        {TAB_BTN('flashcards', <BookOpen className="h-3.5 w-3.5" />,    'Карточки')}
        {TAB_BTN('quiz',       <BrainCircuit className="h-3.5 w-3.5" />, 'Тест')}
        {TAB_BTN('add',        <Plus className="h-3.5 w-3.5" />,         'Добавить')}
      </div>

      {/* Content */}
      {tab === 'list' && <WordTable refreshTrigger={refresh} />}

      {tab === 'add' && <AddWordPanel onAdded={reload} />}

      {tab === 'flashcards' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['all', 'verb', 'noun', 'adjective', 'preposition'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFlashTopic(t)}
                className={`rounded-lg px-3 py-1 text-[11px] font-semibold transition ${
                  flashTopic === t ? 'bg-primary text-white' : 'border border-border text-text-2 hover:bg-gray-50'
                }`}
              >
                {QUIZ_TOPIC_LABEL[t]}
              </button>
            ))}
          </div>
          <FlashcardSession
            key={flashTopic + refresh}
            topic={flashTopic === 'all' ? undefined : flashTopic}
            limit={20}
          />
        </div>
      )}

      {tab === 'quiz' && (
        <div className="space-y-4">
          {!quizWords && <QuizLauncher onStart={(t, c) => void startQuiz(t, c)} />}

          {quizWords && quizWords.length === 0 && (
            <div className="rounded-xl bg-yellow-50 p-5 text-center text-[13px] text-yellow-700">
              Нет слов для теста. Сначала импортируй словарь и повтори несколько карточек.
            </div>
          )}

          {quizWords && quizWords.length > 0 && !quizResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-1">Тест · {quizWords.length} слов</span>
                <button
                  onClick={() => setQuizWords(null)}
                  className="rounded-lg p-1 text-text-2 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <QuizExercise
                words={quizWords}
                onFinish={(c, t) => setQuizResult({ correct: c, total: t })}
              />
            </div>
          )}

          {quizResult && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-white px-6 py-10 text-center">
              <div className="text-4xl">
                {quizResult.correct / quizResult.total >= 0.8 ? '🏆' :
                 quizResult.correct / quizResult.total >= 0.5 ? '👍' : '📚'}
              </div>
              <h3 className="text-[18px] font-bold text-text-1">
                {quizResult.correct} / {quizResult.total}
                {' '}({Math.round((quizResult.correct / quizResult.total) * 100)}%)
              </h3>
              <p className="text-[13px] text-text-2">
                {quizResult.correct / quizResult.total >= 0.8 ? 'Отличный результат!' :
                 quizResult.correct / quizResult.total >= 0.5 ? 'Хорошо, продолжай!' :
                 'Повтори эти слова в карточках'}
              </p>
              <button
                onClick={() => { setQuizWords(null); setQuizResult(null) }}
                className="rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700"
              >
                Ещё раз
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
