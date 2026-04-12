import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const claudeTools: Tool[] = [
  {
    name: 'update_progress',
    description:
      'Обновить XP и pečat (итоговую оценку занятия 1–5) после проверки ответа пользователя.',
    input_schema: {
      type: 'object',
      properties: {
        xp_delta: {
          type: 'number',
          description: 'Сколько XP добавить (10, 5, 3 или 50 за модуль)',
        },
        pecat: {
          type: 'number',
          description: 'Оценка занятия 1–5 (pečat)',
        },
      },
      required: ['xp_delta'],
    },
  },
  {
    name: 'update_word_status',
    description: 'Обновить статус слова в словаре после ответа пользователя.',
    input_schema: {
      type: 'object',
      properties: {
        serbian: { type: 'string', description: 'Форма слова на изучаемом языке' },
        new_status: {
          type: 'string',
          enum: ['new', 'learning', 'learned', 'problem'],
        },
        correct: { type: 'boolean' },
      },
      required: ['serbian', 'new_status', 'correct'],
    },
  },
]
