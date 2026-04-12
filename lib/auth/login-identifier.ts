/**
 * Как в novoprint-accounting: логин → логин@learn-bot.internal (Supabase Auth ждёт email).
 * Старые аккаунты могли быть на learn-bot.local — отображение учитывает оба суффикса.
 */

export const AUTH_INTERNAL_DOMAIN = 'learn-bot.internal'

export const LEGACY_SYNTHETIC_DOMAIN = 'learn-bot.local'

/** Старые аккаунты до выравнивания с novoprint (internal). */
export function toLegacySyntheticEmail(login: string): string {
  const raw = login.trim()
  if (raw.includes('@')) return raw.toLowerCase()
  return `${raw.toLowerCase()}@${LEGACY_SYNTHETIC_DOMAIN}`
}

/** Строка, которую показываем вместо технического email в UI */
export function formatLoginFromAuthEmail(email: string | null | undefined): string {
  if (!email) return '—'
  const lower = email.toLowerCase()
  const internal = `@${AUTH_INTERNAL_DOMAIN}`
  const legacy = `@${LEGACY_SYNTHETIC_DOMAIN}`
  if (lower.endsWith(internal)) return email.slice(0, -internal.length)
  if (lower.endsWith(legacy)) return email.slice(0, -legacy.length)
  return email
}

/**
 * Логин без @ → user@learn-bot.internal (как novoprint: trim + toLowerCase).
 * Если есть @ — считаем это полноценным email (редкий legacy).
 */
export function toAuthEmail(loginOrEmail: string): string {
  const raw = loginOrEmail.trim()
  if (!raw) {
    throw new Error('Введите логин.')
  }
  if (raw.includes('@')) {
    const e = raw.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      throw new Error('Некорректный формат.')
    }
    return e
  }

  return `${raw.toLowerCase()}@${AUTH_INTERNAL_DOMAIN}`
}
