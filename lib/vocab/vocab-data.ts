import type { VerbEntry, NounEntry, AdjectiveEntry, PrepositionEntry, FreqLevel } from './types'
import raw from './vocab-raw.json'

function toFreq(emoji: string): FreqLevel {
  if (emoji === '🔴') return 'super'
  if (emoji === '🟠') return 'high'
  if (emoji === '🟡') return 'medium'
  return 'low'
}

export const VERBS: VerbEntry[] = (raw.verbs as {
  freq: string; ru: string; en_inf: string; en_past: string; en_pp: string
  sr_inf: string; sr_pres: string; sr_perf: string
}[]).map(r => ({
  type: 'verb',
  freq: toFreq(r.freq),
  ru: r.ru,
  en_inf: r.en_inf,
  en_past: r.en_past,
  en_pp: r.en_pp,
  sr_inf: r.sr_inf,
  sr_pres: r.sr_pres,
  sr_perf: r.sr_perf,
}))

export const NOUNS: NounEntry[] = (raw.nouns as {
  freq: string; ru_sg: string; ru_pl: string; en_sg: string; en_pl: string
  sr_sg: string; sr_pl: string; gender: string
}[]).map(r => ({
  type: 'noun',
  freq: toFreq(r.freq),
  ru_sg: r.ru_sg,
  ru_pl: r.ru_pl,
  en_sg: r.en_sg,
  en_pl: r.en_pl,
  sr_sg: r.sr_sg,
  sr_pl: r.sr_pl,
  gender: r.gender,
}))

export const ADJECTIVES: AdjectiveEntry[] = (raw.adjectives as {
  freq: string; ru: string; en: string; sr_m: string; sr_f: string; sr_n: string
  antonym_en: string; antonym_sr: string
}[]).map(r => ({
  type: 'adjective',
  freq: toFreq(r.freq),
  ru: r.ru,
  en: r.en,
  sr_m: r.sr_m,
  sr_f: r.sr_f,
  sr_n: r.sr_n,
  antonym_en: r.antonym_en,
  antonym_sr: r.antonym_sr,
}))

export const PREPOSITIONS: PrepositionEntry[] = (raw.prepositions as {
  freq: string; ru: string; en: string; sr: string; cases: string; ex_sr: string; ex_ru: string
}[]).map(r => ({
  type: 'preposition',
  freq: toFreq(r.freq),
  ru: r.ru,
  en: r.en,
  sr: r.sr,
  cases: r.cases,
  ex_sr: r.ex_sr,
  ex_ru: r.ex_ru,
}))

// Merged list ordered: super > high > medium > low
const FREQ_ORDER: FreqLevel[] = ['super', 'high', 'medium', 'low']
export function freqRank(f: FreqLevel) { return FREQ_ORDER.indexOf(f) }

export const ALL_VOCAB = [
  ...VERBS,
  ...PREPOSITIONS,
  ...NOUNS,
  ...ADJECTIVES,
].sort((a, b) => freqRank(a.freq) - freqRank(b.freq))

export const VOCAB_STATS = {
  verbs: VERBS.length,
  nouns: NOUNS.length,
  adjectives: ADJECTIVES.length,
  prepositions: PREPOSITIONS.length,
  total: VERBS.length + NOUNS.length + ADJECTIVES.length + PREPOSITIONS.length,
}
