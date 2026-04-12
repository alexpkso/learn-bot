# NovoPrint Language Learning App — Полная спецификация
> Сгенерировано из чата с Claude · Апрель 2026  
> Передать в Claude Code как контекст для разработки

---

## 🎯 Суть проекта

Веб-приложение для изучения сербского (и английского) языка.  
Целевой пользователь: Алексей — русскоязычный владелец типографии NovoPrint в Белграде.  
Цель: говорить с клиентами, коллегами, поставщиками на сербском.  
Занятия: 2 раза в день по 15–20 минут (утро — новый материал, вечер — практика).

---

## 🏗️ Стек

- **Frontend:** Next.js 14 (App Router)
- **Auth + DB:** Supabase (Auth + PostgreSQL)
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Voice STT:** Web Speech API (браузерный, бесплатно, `sr-RS` / `en-US`)
- **Voice TTS:** Web Speech API (`speechSynthesis`)
- **Deploy:** Vercel
- **Стиль:** Tailwind CSS

> ⚠️ OpenAI API НЕ используется. Только Anthropic + Supabase + браузерные API.

---

## 🗄️ Схема базы данных

```sql
-- profiles: расширяется автоматически через trigger при регистрации
CREATE TABLE profiles (
  id               UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name             TEXT NOT NULL,
  native_language  TEXT DEFAULT 'ru',
  target_language  TEXT DEFAULT 'sr',        -- 'sr' | 'en'
  onboarding       JSONB,                     -- ответы онбординга
  onboarding_done  BOOLEAN DEFAULT FALSE,
  started_at       TIMESTAMPTZ DEFAULT NOW()
);

-- progress: один ряд на пользователя
CREATE TABLE progress (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  xp             INTEGER DEFAULT 0,
  current_module INTEGER DEFAULT 0,
  last_pecat     INTEGER DEFAULT 0,          -- 1..5
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- words: словарь с интервальным повторением
CREATE TABLE words (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  serbian        TEXT NOT NULL,
  russian        TEXT NOT NULL,
  topic          TEXT,   -- 'products'|'prices'|'time'|'politeness'|'process'
  status         TEXT DEFAULT 'new',  -- 'new'|'learning'|'learned'|'problem'
  error_count    INTEGER DEFAULT 0,
  streak         INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- sessions: история занятий
CREATE TABLE sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,    -- 'morning' | 'evening'
  module     INTEGER NOT NULL,
  pecat      INTEGER,          -- итоговая оценка 1..5
  xp_earned  INTEGER DEFAULT 0,
  summary    TEXT,             -- краткое резюме занятия
  messages   JSONB,            -- [{role, content}] полная история чата
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- programs: персональная учебная программа
CREATE TABLE programs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,            -- 'sr' | 'en'
  status      TEXT DEFAULT 'draft',    -- 'draft' | 'confirmed'
  modules     JSONB NOT NULL,
  -- modules структура:
  -- [{id, title, description, topics[], vocabulary[{sr,ru}], situations[], estimated_days}]
  user_notes  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- voice_sessions: голосовые сессии
CREATE TABLE voice_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transcript      TEXT,
  detected_lang   TEXT,
  claude_response TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS политики
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE words         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own" ON profiles       USING (auth.uid() = id);
CREATE POLICY "own" ON progress       USING (auth.uid() = user_id);
CREATE POLICY "own" ON words          USING (auth.uid() = user_id);
CREATE POLICY "own" ON sessions       USING (auth.uid() = user_id);
CREATE POLICY "own" ON programs       USING (auth.uid() = user_id);
CREATE POLICY "own" ON voice_sessions USING (auth.uid() = user_id);
```

---

## 📁 Структура файлов

```
app/
├── (auth)/
│   └── login/page.tsx
├── (onboarding)/
│   └── onboarding/
│       ├── page.tsx              ← wizard 6 шагов
│       └── program/page.tsx      ← показ + согласование программы
├── (app)/
│   ├── layout.tsx                ← защищённый layout (проверка auth)
│   ├── dashboard/page.tsx
│   ├── lesson/page.tsx           ← ?type=morning|evening
│   ├── vocabulary/page.tsx
│   ├── progress/page.tsx
│   └── program/page.tsx
├── api/
│   ├── chat/route.ts             ← POST → ReadableStream (SSE)
│   ├── words/route.ts            ← GET / POST / PATCH
│   ├── progress/route.ts         ← GET / POST
│   ├── sessions/route.ts         ← GET / POST
│   └── program/
│       ├── generate/route.ts     ← Claude генерирует программу
│       └── refine/route.ts       ← уточнение программы
└── layout.tsx

lib/
├── supabase/
│   ├── client.ts                 ← createBrowserClient()
│   └── server.ts                 ← createServerClient() для RSC/API routes
├── claude/
│   ├── system-prompt.ts          ← buildSystemPrompt(userContext) → string
│   └── tools.ts                  ← tool definitions: update_xp, update_word_status
├── onboarding/
│   ├── questions.ts
│   └── buildSystemPrompt.ts
├── voice/
│   └── useVoice.ts               ← Web Speech API hook
└── types.ts

components/
├── chat/
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   └── InputBar.tsx
├── dashboard/
│   ├── XPBar.tsx
│   ├── PecatBadge.tsx
│   └── WordsDue.tsx
├── onboarding/
│   ├── StepWizard.tsx
│   └── ProgramPreview.tsx
└── voice/
    ├── VoiceButton.tsx           ← push-to-talk
    └── VoiceStatus.tsx           ← состояние: запись/транскрипция/ответ

middleware.ts                     ← Supabase Auth session refresh (обязательно!)
```

---

## 🔑 Переменные окружения

```env
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 🤖 Системный промпт Claude (учитель)

Файл: `lib/claude/system-prompt.ts`

```ts
export function buildSystemPrompt(ctx: UserContext): string {
  return `
Ты — персональный учитель ${ctx.targetLanguage === 'sr' ? 'сербского' : 'английского'} языка для ${ctx.name}.

${ctx.name} — русскоязычный владелец типографии NovoPrint в Белграде, Сербия.
Уровень: начинающий (практически нулевой).
Цель: говорить с клиентами, коллегами, поставщиками и партнёрами.
Все объяснения — на русском языке.
Сербский даётся только в латинице (srpska latinica).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
СТИЛЬ И ПОВЕДЕНИЕ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Строгий, но доброжелательный. Не хвалишь за посредственное.
- Исправляешь ошибки ТОЛЬКО ПОСЛЕ того, как пользователь закончил ответ.
- Ведёшь учёт прогресса, напоминаешь о слабых местах.
- В голосовом режиме: говори естественно, не читай таблицы.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
СИСТЕМА ОЦЕНОК — PEČAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 pečat — плохо, тема не усвоена
2 pečata — слабо, много ошибок
3 pečata — удовлетворительно
4 pečata — хорошо, мелкие неточности
5 pečata — отлично, правильно и уверенно

XP: правильно с 1-й попытки +10, со 2-й +5, повторение +3, модуль +50

Уровни: 0–200 Početnik · 201–500 Učenik · 501–1000 Saradnik · 1001–2000 Profesionalac · 2000+ Majstor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
СЛОВАРНАЯ СИСТЕМА
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Статусы: Новое (3 дня подряд) → Закрепление (+1/+3/+7 дней) → Выучено (+14 дней) → Проблемное (откат)
Утренняя разминка: 5–7 слов. Русский → сербский или наоборот.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
КОНТЕКСТ NOVOPRINT (цены для ролевых упражнений)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Флаеры (160 g/m²):
- Flajer A6: от 1400 (50 шт, 1 ст.) до 6200 RSD (500 шт, 2 ст.)
- Flajer A5: от 1900 до 9900 RSD
- Flajer A4: от 2500 до 21100 RSD

Визитки (300–350 g/m²):
- Классические: от 1300 (50 шт) до 5600 RSD (1000 шт, 2 ст.)
- Дизайнерские: от 1600 до 9700 RSD

Наклейки (листы A3):
- Бумага: от 2300 до 23000 RSD
- PVC (водост.): от 3200 до 49800 RSD

Копирование: A4 ч/б 10–20 RSD, A4 цвет 30–50 RSD
Ламинирование: 70–120 RSD, Сканирование: 30–40 RSD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ПЕРСОНАЖИ ДЛЯ РОЛЕВЫХ УПРАЖНЕНИЙ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MARKO PETROVIĆ — клиент, м, ~40 лет, торопится, уточняет цену/сроки
2. ANA ĐORĐEVIĆ — постоянный клиент, м-р по маркетингу, много вопросов про макеты
3. ZORAN — поставщик бумаги, немногословный, обсуждает объёмы
4. JOVANA — новый клиент, растерянная, нужна помощь с выбором
5. STEFAN — коллега, разговорный язык

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ПРОГРАММА МОДУЛЕЙ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0: Фонетика и алфавит (2–3 дня)
1: Телефонный звонок: базовый 🔥 ПРИОРИТЕТ (5–7 дней)
2: Продукты и цены (5–7 дней)
3: Сроки и договорённости (4–5 дней)
4: Файлы и технические детали (4–5 дней)
5: Живой диалог с клиентом (7–10 дней)
6: Коллеги и поставщики (5–7 дней)
7: Повседневная жизнь (5–7 дней)
8: Свободная практика (постоянно)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
СТРУКТУРА ЗАНЯТИЯ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
УТРО: сводка XP/pečat → разминка 5–7 слов → новая тема → упражнение → итог
ВЕЧЕР: тест на утренний материал → ролевой диалог → разбор ошибок → pečat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ТЕКУЩИЙ КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
XP: ${ctx.xp}
Уровень: ${ctx.level}
Модуль: ${ctx.currentModule}
Последний pečat: ${ctx.lastPecat}
Тип занятия: ${ctx.sessionType}
Слова на сегодня: ${ctx.wordsDue?.map((w: any) => w.serbian).join(', ') || 'нет'}
  `.trim()
}
```

---

## 🛣️ API Маршруты

### `POST /api/chat` — главный маршрут (стриминг)

```ts
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/claude/system-prompt'
import { claudeTools } from '@/lib/claude/tools'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const { messages, sessionType } = await req.json()
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Загружаем контекст пользователя
  const [profileRes, progressRes, wordsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('progress').select('*').eq('user_id', user.id).single(),
    supabase.from('words').select('*').eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString()).limit(10),
  ])

  const ctx = {
    name: profileRes.data?.name,
    xp: progressRes.data?.xp ?? 0,
    level: getLevel(progressRes.data?.xp ?? 0),
    currentModule: progressRes.data?.current_module ?? 0,
    lastPecat: progressRes.data?.last_pecat ?? 0,
    sessionType,
    wordsDue: wordsRes.data ?? [],
    targetLanguage: profileRes.data?.target_language ?? 'sr',
  }

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: buildSystemPrompt(ctx),
    messages,
    tools: claudeTools,
  })

  return new Response(stream.toReadableStream())
}

function getLevel(xp: number) {
  if (xp <= 200)  return 'Početnik'
  if (xp <= 500)  return 'Učenik'
  if (xp <= 1000) return 'Saradnik'
  if (xp <= 2000) return 'Profesionalac'
  return 'Majstor'
}
```

### `lib/claude/tools.ts` — инструменты Claude

```ts
import { Tool } from '@anthropic-ai/sdk/resources'

export const claudeTools: Tool[] = [
  {
    name: 'update_progress',
    description: 'Обновить XP и pečat после оценки ответа пользователя',
    input_schema: {
      type: 'object',
      properties: {
        xp_delta: { type: 'number', description: 'Очков XP добавить (10, 5, 3 или 50 за модуль)' },
        pecat:    { type: 'number', description: 'Оценка занятия 1-5' },
      },
      required: ['xp_delta'],
    },
  },
  {
    name: 'update_word_status',
    description: 'Обновить статус слова в словаре после ответа пользователя',
    input_schema: {
      type: 'object',
      properties: {
        serbian:    { type: 'string' },
        new_status: { type: 'string', enum: ['new', 'learning', 'learned', 'problem'] },
        correct:    { type: 'boolean' },
      },
      required: ['serbian', 'new_status', 'correct'],
    },
  },
]
```

### `POST /api/program/generate` — генерация программы

```ts
// app/api/program/generate/route.ts
export async function POST(req: Request) {
  const { onboardingData } = await req.json()
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `
Создай персональную программу изучения ${onboardingData.language === 'sr' ? 'сербского' : 'английского'} языка.

Контекст пользователя:
${JSON.stringify(onboardingData, null, 2)}

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "modules": [
    {
      "id": 0,
      "title": "...",
      "description": "...",
      "topics": ["..."],
      "vocabulary": [{"sr": "...", "ru": "..."}],
      "situations": ["..."],
      "estimated_days": 5
    }
  ]
}
      `
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const program = JSON.parse(text)

  await supabase.from('programs').insert({
    user_id: user!.id,
    language: onboardingData.language,
    modules: program.modules,
    status: 'draft',
  })

  return Response.json(program)
}
```

---

## 🎙️ Голосовой пайплайн

**Пайплайн:** Микрофон → Web Speech API STT → `/api/chat` (Claude) → Web Speech API TTS

```ts
// lib/voice/useVoice.ts
'use client'
import { useState, useRef } from 'react'

export function useVoice(targetLanguage: 'sr' | 'en' = 'sr') {
  const [status, setStatus] = useState<'idle'|'recording'|'thinking'|'speaking'>('idle')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const langMap = { sr: 'sr-RS', en: 'en-US' }
  const lang = langMap[targetLanguage]

  const startListening = (onTranscript: (text: string) => void) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setStatus('recording')
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setStatus('thinking')
      onTranscript(text)
    }
    recognition.onerror = () => setStatus('idle')
    recognition.start()
    recognitionRef.current = recognition
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  const speak = (text: string) => {
    setStatus('speaking')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9  // чуть медленнее для учёбы
    utterance.onend = () => setStatus('idle')
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  return { status, startListening, stopListening, speak }
}
```

---

## 📋 Онбординг — вопросы

Файл: `lib/onboarding/questions.ts`

```ts
export const ONBOARDING_STEPS = [
  {
    id: 'name',
    question: 'Как тебя зовут?',
    type: 'text',
  },
  {
    id: 'language',
    question: 'Какой язык хочешь учить?',
    type: 'select',
    options: [
      { value: 'sr', label: 'Сербский' },
      { value: 'en', label: 'Английский' },
    ],
  },
  {
    id: 'level',
    question: 'Твой текущий уровень?',
    type: 'select',
    options: [
      { value: 'zero',         label: 'Нулевой — не знаю ни слова' },
      { value: 'beginner',     label: 'Начальный — знаю базовые слова' },
      { value: 'intermediate', label: 'Средний — могу объясниться' },
    ],
  },
  {
    id: 'goal',
    question: 'Зачем учишь язык? Опиши конкретные ситуации, где он нужен.',
    type: 'textarea',
    placeholder: 'Например: общаться с клиентами, читать документы, жить в стране...',
  },
  {
    id: 'context',
    question: 'Расскажи о себе и своей работе. Это поможет сделать программу точнее.',
    type: 'textarea',
    placeholder: 'Профессия, где живёшь, с кем общаешься...',
  },
  {
    id: 'time',
    question: 'Сколько минут в день готов заниматься?',
    type: 'select',
    options: [
      { value: 15, label: '15 минут' },
      { value: 30, label: '30 минут' },
      { value: 60, label: '1 час' },
    ],
  },
  {
    id: 'priorities',
    question: 'Есть конкретные темы, слова или ситуации, которые нужны прямо сейчас?',
    type: 'textarea',
    optional: true,
    placeholder: 'Необязательно. Например: цены на продукцию, технические термины...',
  },
]

// Формат хранения в profiles.onboarding (JSONB):
// {
//   name: "Алексей",
//   language: "sr",
//   level: "zero",
//   goal: "Общаться с клиентами типографии в Белграде",
//   context: "Владелец типографии NovoPrint, говорю с клиентами и поставщиками",
//   time: 30,
//   priorities: "Флаеры, визитки, цены, сроки"
// }
```

---

## 🎨 Дизайн-система (из novoprint-accounting.vercel.app)

### `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4361EE',
          light:   '#EEF2FF',
        },
        surface: '#FFFFFF',
        bg:      '#F2F5FA',
        border:  '#E8ECF4',
        text: {
          1: '#1B2559',   // основной тёмно-синий
          2: '#8A97B0',   // серый/второстепенный
        },
        green:  '#22C55E',
        red:    '#EF4444',
        orange: '#F97316',
        amber:  '#F59E0B',  // звёзды pečat
      },
      borderRadius: {
        card: '11px',
        pill: '20px',
        btn:  '7px',
      },
    },
  },
  plugins: [],
}

export default config
```

### Ключевые паттерны компонентов

```tsx
// Sidebar nav item
const navBase   = "flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-slate-600 cursor-pointer relative hover:bg-gray-50 transition-colors"
const navActive = "bg-primary-light text-primary font-semibold before:absolute before:left-0 before:inset-y-0 before:w-[3px] before:bg-primary before:rounded-r-sm"

// Card
const card = "bg-white border border-border rounded-card p-3.5"

// Section title (uppercase label)
const sectionTitle = "text-[11px] font-black tracking-[.05em] uppercase text-text-1"

// Card label
const cardLabel = "text-[9px] font-black tracking-[.08em] uppercase text-text-2"

// Status pills для слов
const pills = {
  new:      "bg-primary-light text-primary",
  learning: "bg-orange-50 text-orange",
  learned:  "bg-green-50 text-green-700",
  problem:  "bg-red-50 text-red",
} as const

// Primary button
const btnPrimary = "bg-primary text-white rounded-btn px-3 py-1.5 text-[11px] font-bold hover:bg-blue-700 transition-colors"

// Tab button (неделя/месяц/квартал)
const tabBtn = "text-[10px] px-2.5 py-1 rounded-md border border-border text-text-2 hover:bg-bg transition-colors"
const tabBtnActive = "bg-bg text-text-1 font-semibold"
```

### Структура Layout (Sidebar + Main)

```tsx
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

### Sidebar структура (навигация)

```tsx
const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Дашборд',   icon: GridIcon   },
  { href: '/lesson',      label: 'Занятие',   icon: BookIcon   },
  { href: '/vocabulary',  label: 'Словарь',   icon: ListIcon   },
  { href: '/progress',    label: 'Прогресс',  icon: ChartIcon  },
  { href: '/program',     label: 'Программа', icon: DocIcon    },
  { href: '/settings',    label: 'Настройки', icon: GearIcon   },
]
// + "Выйти" в красном внизу
```

---

## 🔄 Логика интервального повторения

```ts
// lib/words/spaced-repetition.ts
export function getNextReviewDate(status: string, streak: number, correct: boolean): Date {
  const now = new Date()

  if (!correct) {
    // Ошибка → откат к 'problem', повторить завтра
    now.setDate(now.getDate() + 1)
    return now
  }

  const intervals: Record<string, number[]> = {
    new:      [1, 1, 1],         // 3 дня подряд
    learning: [1, 3, 7],         // через 1, 3, 7 дней
    learned:  [14],              // раз в 2 недели
    problem:  [1, 1, 3],         // чаще после ошибки
  }

  const daysMap = intervals[status] ?? [1]
  const days = daysMap[Math.min(streak, daysMap.length - 1)]
  now.setDate(now.getDate() + days)
  return now
}

export function getNextStatus(current: string, streak: number, correct: boolean): string {
  if (!correct) return 'problem'
  if (current === 'new' && streak >= 2)      return 'learning'
  if (current === 'learning' && streak >= 2) return 'learned'
  if (current === 'problem' && streak >= 1)  return 'learning'
  return current
}
```

---

## 🌐 `middleware.ts` (обязателен для Supabase Auth)

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Редиректы
  if (!user && request.nextUrl.pathname.startsWith('/(app)')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

---

## 📦 Зависимости (`package.json`)

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "latest",
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "next": "14.x",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

---

## ✅ Чеклист разработки

### Фаза 1 — Основа
- [ ] Инициализация Next.js 14 + Supabase + Tailwind
- [ ] `middleware.ts` — защита маршрутов
- [ ] Supabase: создать все таблицы + RLS политики
- [ ] Auth: login/register страница
- [ ] Онбординг wizard (6 шагов)
- [ ] Генерация программы через Claude API
- [ ] Страница согласования программы

### Фаза 2 — Основной функционал
- [ ] Dashboard — XP, модуль, слова, pečat
- [ ] Lesson page — утреннее/вечернее занятие, чат со стримингом
- [ ] Claude tool use — `update_progress`, `update_word_status`
- [ ] Vocabulary page — список слов, статусы, фильтры
- [ ] Словарная разминка (5–7 слов)
- [ ] Progress page — история занятий, XP-график

### Фаза 3 — Голос
- [ ] `useVoice` hook — Web Speech API
- [ ] VoiceButton компонент (push-to-talk)
- [ ] Интеграция в Lesson page
- [ ] Статусы: запись / думает / отвечает

### Фаза 4 — Полировка
- [ ] Адаптация под мобильные
- [ ] Тёмная тема (опционально)
- [ ] Уведомления о пропущенных занятиях
- [ ] Экспорт прогресса

---

*Файл сгенерирован из сессии планирования с Claude · novoprint-accounting.vercel.app дизайн-токены сняты со скриншота*
