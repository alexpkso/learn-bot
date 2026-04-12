# Supabase — настройка под Language Lab

Пошагово: от создания проекта до проверки, что приложение на Vercel может авторизоваться и писать в БД.

---

## 1. Проект и ключи

1. Зайди на [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** (или открой уже созданный).
2. Запомни **пароль БД** (он нужен только для прямого подключения к Postgres; для приложения не обязателен).
3. **Project Settings** (шестерёнка) → **API**:
   - **Project URL** — это `NEXT_PUBLIC_SUPABASE_URL`;
   - **anon public** — это `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ключ с префиксом `eyJ...`).

Скопируй оба значения — они пойдут в Vercel (Environment Variables) и локально в `.env.local`.

**Service Role** (`service_role`) в код этого приложения **не подставляй** в клиент и не коммить — он обходит RLS. Для текущей архитектуры достаточно **anon** + сессия пользователя.

---

## 2. Схема базы (таблицы, триггер, RLS)

1. В левом меню: **SQL Editor** → **New query**.
2. Открой локальный файл репозитория  
   `supabase/migrations/20260412120000_init.sql`
3. Вставь **весь** текст в редактор и нажми **Run**.

Должно выполниться без ошибок. Что появится:

| Таблица          | Назначение                          |
|------------------|-------------------------------------|
| `profiles`       | имя, языки, онбординг              |
| `progress`       | XP, модуль, pečat                  |
| `words`          | словарь + интервалы                |
| `sessions`       | история занятий и чат (JSON)       |
| `programs`       | программа (черновик / подтверждённая) |
| `voice_sessions` | голос (на будущее)                 |

Триггер **`on_auth_user_created`** на `auth.users`: при регистрации создаёт строку в `profiles` и `progress` (имя берётся из `raw_user_meta_data.name` при регистрации).

---

## 3. Authentication (важно для Vercel)

### 3.1. Email / пароль

1. **Authentication** → **Providers** → **Email**:
   - провайдер **включён**;
   - если нужен вход **без письма** — отключи **Confirm email** (как мы договаривались для MVP).

### 3.2. URL сайта и редиректы

Иначе после логина с продакшена сессия «не прилипнет».

1. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://<твой-проект>.vercel.app` (точный URL из Vercel).
   - **Redirect URLs** — добавь:
     - `https://<твой-проект>.vercel.app/**`
     - `http://localhost:3000/**` (для `npm run dev`).

Сохрани изменения.

### 3.3. OAuth (по желанию)

Google и др. можно включить позже в **Providers** — для текущего кода достаточно email/пароля.

---

## 4. Переменные окружения

### Локально (`F:\learn-bot\.env.local`)

Скопируй из `.env.local.example` и заполни:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
ANTHROPIC_API_KEY=sk-ant-...
```

### Vercel

**Project** → **Settings** → **Environment Variables** — те же три переменные для **Production** (и при необходимости **Preview**).

После изменения переменных сделай **Redeploy**.

Переменные с префиксом `NEXT_PUBLIC_` подставляются **на этапе сборки**. Если добавил их в Vercel после первого деплоя — обязательно **Redeploy** (иначе в бандле могут быть пустые значения и упадёт middleware с `MIDDLEWARE_INVOCATION_FAILED`).

---

## 5. Быстрая проверка

1. Открой продакшен-URL или `localhost:3000`.
2. **Регистрация** нового пользователя → в Supabase **Table Editor** → `profiles` и `progress` должны появиться новые строки с твоим `user.id`.
3. Пройди онбординг → в `profiles` обновится `onboarding`, после подтверждения программы — `onboarding_done = true`.
4. Если в консоли браузера ошибки вида `new row violates row-level security` — напиши, какой запрос (таблица); обычно это неверный `user_id` или не залогинен.

---

## 6. Полезные ссылки Supabase

- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Server-side auth для Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) (у нас уже есть `middleware` и `@supabase/ssr`)

---

## 7. Повторный запуск миграции

Если скрипт уже частично применялся, повторный **Run** может дать ошибки «already exists». Тогда:

- либо создай **новый** проект Supabase и примени миграцию на чистую БД;
- либо вручную удали объекты в обратном порядке (осторожно, в проде не делай без бэкапа).

Для первого деплоя достаточно одного успешного запуска `20260412120000_init.sql` на пустой проект.
