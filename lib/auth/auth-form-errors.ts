/** Понятные сообщения для форм входа/регистрации (Supabase Auth). */

export function mapSignUpApiError(message: string, code?: string): string {
  const m = message.toLowerCase()

  if (
    code === 'unexpected_failure' ||
    m.includes('database error') ||
    m.includes('saving new user') ||
    m.includes('error saving user')
  ) {
    return (
      'Ошибка базы при регистрации (часто триггер профиля). Откройте Supabase → SQL Editor, ' +
      'выполните миграцию 20260412190000_fix_signup_profile_trigger.sql из репозитория, затем повторите регистрацию.'
    )
  }

  if (
    m.includes('already') ||
    m.includes('registered') ||
    m.includes('exists') ||
    m.includes('user already')
  ) {
    return 'Такой логин уже занят. Войдите или выберите другой.'
  }

  if (m.includes('password') && (m.includes('least') || m.includes('short') || m.includes('6'))) {
    return 'Пароль слишком короткий: нужно не меньше 6 символов.'
  }

  if (m.includes('invalid') && (m.includes('email') || m.includes('login'))) {
    return 'Логин не принят. Попробуйте другой (латиница и цифры, без пробелов).'
  }

  if (m.includes('signup') && m.includes('disabled')) {
    return 'Регистрация отключена в настройках сервера. Обратитесь к администратору.'
  }

  if (m.includes('email') && (m.includes('not confirmed') || m.includes('confirm'))) {
    return 'Требуется подтверждение — в панели сервера отключите подтверждение для входа по логину.'
  }

  // Коротко показываем ответ API (часто на англ.), чтобы можно было отладить
  const short = message.length > 160 ? `${message.slice(0, 160)}…` : message
  return `Не удалось создать аккаунт: ${short}`
}

export function mapThrownAuthError(e: unknown): string {
  if (e instanceof Error) {
    const msg = e.message
    if (msg.includes('Invalid supabaseUrl') || msg.includes('supabaseUrl is required')) {
      return 'Неверный NEXT_PUBLIC_SUPABASE_URL. Укажите полный адрес: https://xxxx.supabase.co (обязательно https://).'
    }
    if (msg.includes('Нет переменных Supabase') || msg.includes('NEXT_PUBLIC_SUPABASE')) {
      return 'Приложение собрано без ключей Supabase. Добавьте NEXT_PUBLIC_SUPABASE_URL и ключ (anon или publishable) в Vercel → Environment → Production и сделайте Redeploy.'
    }
    if (msg.startsWith('Введите') || msg.startsWith('Некорректный')) {
      return msg
    }
    const short = msg.length > 200 ? `${msg.slice(0, 200)}…` : msg
    return `Ошибка: ${short}`
  }
  return 'Не удалось выполнить действие. Попробуйте ещё раз.'
}
