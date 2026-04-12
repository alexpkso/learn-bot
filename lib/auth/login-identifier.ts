/**
 * Синтетический «email» для Supabase Auth: логин@домен.
 * Короткий домен без дефиса — меньше шансов отсечься валидацией.
 * Старые суффиксы оставляем для входа и отображения.
 */

export const AUTH_INTERNAL_DOMAIN = 'learnbot.local'

export const LEGACY_SYNTHETIC_DOMAIN = 'learn-bot.local'

/** Ещё один вариант для старых учёток. */
export const LEGACY_INTERNAL_DOMAIN = 'learn-bot.internal'

/** Старые аккаунты. */
export function toLegacySyntheticEmail(login: string): string {
  const raw = login.trim()
  if (raw.includes('@')) return raw.toLowerCase()
  return `${raw.toLowerCase()}@${LEGACY_SYNTHETIC_DOMAIN}`
}

export function toLegacyInternalSyntheticEmail(login: string): string {
  const raw = login.trim()
  if (raw.includes('@')) return raw.toLowerCase()
  return `${raw.toLowerCase()}@${LEGACY_INTERNAL_DOMAIN}`
}

/** Строка, которую показываем вместо технического email в UI */
export function formatLoginFromAuthEmail(email: string | null | undefined): string {
  if (!email) return '—'
  const lower = email.toLowerCase()
  const internal = `@${AUTH_INTERNAL_DOMAIN}`
  const legacy = `@${LEGACY_SYNTHETIC_DOMAIN}`
  const legacy2 = `@${LEGACY_INTERNAL_DOMAIN}`
  if (lower.endsWith(internal)) return email.slice(0, -internal.length)
  if (lower.endsWith(legacy)) return email.slice(0, -legacy.length)
  if (lower.endsWith(legacy2)) return email.slice(0, -legacy2.length)
  return email
}

/**
 * Логин без @ → user@learnbot.local (trim + toLowerCase).
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
