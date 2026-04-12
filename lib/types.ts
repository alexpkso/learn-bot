export type TargetLanguage = 'sr' | 'en'

export type SessionType = 'morning' | 'evening'

export type WordStatus = 'new' | 'learning' | 'learned' | 'problem'

export type ProgramModule = {
  id: number
  title: string
  description: string
  topics: string[]
  vocabulary: { sr: string; ru: string }[]
  situations: string[]
  estimated_days: number
}

export type OnboardingPayload = {
  name: string
  native_language: string
  language: TargetLanguage
  level: string
  goal: string
  context: string
  time: number
  priorities?: string
  blockers?: string
  practice_style?: string
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }
