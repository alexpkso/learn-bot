import type { OnboardingPayload } from '@/lib/types'

export type OnboardingField = {
  id: keyof OnboardingPayload | 'native_language' | 'blockers' | 'practice_style'
  question: string
  type: 'text' | 'textarea' | 'select'
  options?: { value: string | number; label: string }[]
  placeholder?: string
  optional?: boolean
}

/** Подробный онбординг: цели и контекст задаёт сам пользователь */
export const ONBOARDING_STEPS: OnboardingField[] = [
  {
    id: 'name',
    question: 'Как к тебе обращаться?',
    type: 'text',
    placeholder: 'Имя или как удобно',
  },
  {
    id: 'native_language',
    question: 'На каком языке удобнее получать объяснения?',
    type: 'select',
    options: [
      { value: 'ru', label: 'Русский' },
      { value: 'uk', label: 'Українська' },
      { value: 'en', label: 'English' },
      { value: 'sr', label: 'Српски' },
    ],
  },
  {
    id: 'language',
    question: 'Какой язык учишь?',
    type: 'select',
    options: [
      { value: 'sr', label: 'Сербский' },
      { value: 'en', label: 'Английский' },
    ],
  },
  {
    id: 'level',
    question: 'Как оцениваешь свой текущий уровень?',
    type: 'select',
    options: [
      { value: 'zero', label: 'Нулевой — почти не знаю' },
      { value: 'beginner', label: 'Начальный — базовые слова и фразы' },
      { value: 'intermediate', label: 'Средний — могу объясниться' },
    ],
  },
  {
    id: 'goal',
    question: 'Зачем тебе язык? Опиши конкретные ситуации (работа, быт, учёба).',
    type: 'textarea',
    placeholder:
      'Например: разговаривать с клиентами, вести переписку, читать документы…',
  },
  {
    id: 'context',
    question: 'Контекст: чем занимаешься, где живёшь, с кем чаще всего говоришь?',
    type: 'textarea',
    placeholder: 'Профессия, город, коллеги, семья — что важно для диалогов',
  },
  {
    id: 'time',
    question: 'Сколько минут в день реально выделить?',
    type: 'select',
    options: [
      { value: 15, label: 'Около 15 минут' },
      { value: 30, label: 'Около 30 минут' },
      { value: 60, label: 'Около часа' },
    ],
  },
  {
    id: 'priorities',
    question: 'Есть темы или ситуации «срочно нужны»?',
    type: 'textarea',
    optional: true,
    placeholder: 'Необязательно: цены, телефонные звонки, малый бизнес…',
  },
  {
    id: 'blockers',
    question: 'Что обычно мешает: произношение, грамматика, словарь, стеснение?',
    type: 'textarea',
    optional: true,
    placeholder: 'По желанию',
  },
  {
    id: 'practice_style',
    question: 'Как удобнее тренироваться: диалоги, карточки, чтение, письмо?',
    type: 'textarea',
    optional: true,
    placeholder: 'По желанию',
  },
]
