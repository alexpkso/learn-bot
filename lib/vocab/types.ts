export type WordType = 'verb' | 'noun' | 'adjective' | 'preposition'
export type FreqLevel = 'super' | 'high' | 'medium' | 'low'

export interface VerbEntry {
  type: 'verb'
  freq: FreqLevel
  ru: string
  en_inf: string
  en_past: string
  en_pp: string
  sr_inf: string
  sr_pres: string   // prezent 1sg
  sr_perf: string   // perfekat 1sg
}

export interface NounEntry {
  type: 'noun'
  freq: FreqLevel
  ru_sg: string
  ru_pl: string
  en_sg: string
  en_pl: string
  sr_sg: string
  sr_pl: string
  gender: string    // m/f/n
}

export interface AdjectiveEntry {
  type: 'adjective'
  freq: FreqLevel
  ru: string
  en: string
  sr_m: string
  sr_f: string
  sr_n: string
  antonym_en: string
  antonym_sr: string
}

export interface PrepositionEntry {
  type: 'preposition'
  freq: FreqLevel
  ru: string
  en: string
  sr: string
  cases: string
  ex_sr: string
  ex_ru: string
}

export type VocabEntry = VerbEntry | NounEntry | AdjectiveEntry | PrepositionEntry

// DB row from `words` table enriched with vocab metadata
export interface WordRow {
  id: string
  serbian: string
  russian: string
  topic: string | null
  status: 'new' | 'learning' | 'learned' | 'problem'
  streak: number
  error_count: number
  next_review_at: string
  created_at: string
  // stored in topic field as JSON extras
  extras?: string
}
