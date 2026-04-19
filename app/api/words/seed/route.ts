/**
 * POST /api/words/seed
 * Bulk-imports vocab from vocab_table.xlsx into the user's words table.
 * Skips words that already exist (matched by serbian field).
 * Body: { limit?: number } — defaults to all
 */
import { NextResponse } from 'next/server'
import { createServerClientSupabase, missingSupabaseConfigResponse } from '@/lib/supabase/server'
import { VERBS, NOUNS, ADJECTIVES, PREPOSITIONS } from '@/lib/vocab/vocab-data'
import type { VocabEntry } from '@/lib/vocab/types'

export const dynamic = 'force-dynamic'

function toRow(entry: VocabEntry): { serbian: string; russian: string; topic: string; extras: string } {
  switch (entry.type) {
    case 'verb':
      return {
        serbian: entry.sr_inf,
        russian: entry.ru,
        topic: 'verb',
        extras: JSON.stringify({
          en_inf: entry.en_inf, en_past: entry.en_past, en_pp: entry.en_pp,
          sr_pres: entry.sr_pres, sr_perf: entry.sr_perf, freq: entry.freq,
        }),
      }
    case 'noun':
      return {
        serbian: entry.sr_sg,
        russian: entry.ru_sg,
        topic: 'noun',
        extras: JSON.stringify({
          ru_pl: entry.ru_pl, en_sg: entry.en_sg, en_pl: entry.en_pl,
          sr_pl: entry.sr_pl, gender: entry.gender, freq: entry.freq,
        }),
      }
    case 'adjective':
      return {
        serbian: entry.sr_m,
        russian: entry.ru,
        topic: 'adjective',
        extras: JSON.stringify({
          en: entry.en, sr_f: entry.sr_f, sr_n: entry.sr_n,
          antonym_en: entry.antonym_en, antonym_sr: entry.antonym_sr, freq: entry.freq,
        }),
      }
    case 'preposition':
      return {
        serbian: entry.sr,
        russian: entry.ru,
        topic: 'preposition',
        extras: JSON.stringify({
          en: entry.en, cases: entry.cases, ex_sr: entry.ex_sr, ex_ru: entry.ex_ru, freq: entry.freq,
        }),
      }
  }
}

// Sort by frequency: super first
const FREQ_ORDER: Record<string, number> = { super: 0, high: 1, medium: 2, low: 3 }
const ALL = [
  ...VERBS, ...PREPOSITIONS, ...NOUNS, ...ADJECTIVES,
].sort((a, b) => (FREQ_ORDER[a.freq] ?? 3) - (FREQ_ORDER[b.freq] ?? 3))

export async function POST(req: Request) {
  const supabase = createServerClientSupabase()
  if (!supabase) return missingSupabaseConfigResponse()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { limit?: number; types?: string[] }
  const typeFilter = body.types ?? ['verb', 'noun', 'adjective', 'preposition']

  const toImport = ALL.filter(e => typeFilter.includes(e.type)).slice(0, body.limit ?? ALL.length)

  // Get existing words (to skip duplicates)
  const { data: existing } = await supabase
    .from('words')
    .select('serbian')
    .eq('user_id', user.id)

  const existingSet = new Set((existing ?? []).map(r => r.serbian.toLowerCase()))

  const rows = toImport
    .map(toRow)
    .filter(r => !existingSet.has(r.serbian.toLowerCase()))
    .map(r => ({
      user_id: user.id,
      serbian: r.serbian,
      russian: r.russian,
      topic: r.topic,
      extras: r.extras,
      next_review_at: new Date().toISOString(),
    }))

  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, message: 'Nothing new to import' })
  }

  // Insert in batches of 100
  let imported = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error } = await supabase.from('words').insert(batch)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    imported += batch.length
  }

  return NextResponse.json({ imported, total: rows.length + existingSet.size })
}
