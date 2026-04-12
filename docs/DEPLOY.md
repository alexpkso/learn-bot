# Деплой: GitHub + Vercel + Supabase

Краткая инструкция под проект **Language Lab** в `F:\learn-bot`.

## 1. Репозиторий на GitHub

1. Зайдите на [https://github.com/new](https://github.com/new).
2. Укажите имя репозитория (например `learn-bot`), **Public** или **Private**.
3. **Не** добавляйте README / .gitignore / license, если папка уже локально готова — или добавьте и потом смержите.
4. В каталоге проекта выполните (подставьте свой URL):

```bash
cd F:\learn-bot
git init
git add .
git commit -m "Initial Language Lab app"
git branch -M main
git remote add origin https://github.com/<ваш-логин>/learn-bot.git
git push -u origin main
```

Если репозиторий уже создан пустым, одного `git push` достаточно.

## 2. Проект Supabase

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) → ваш проект.
2. **SQL** → New query → вставьте содержимое `supabase/migrations/20260412120000_init.sql` → **Run**.
3. **Authentication** → **Providers** → **Email**:
   - включите **Email**;
   - отключите **Confirm email** (как вы просили — вход без письма).  
     Или оставьте подтверждение — тогда пользователь после регистрации должен перейти по ссылке из письма.
4. Скопируйте ключи: **Project Settings** → **API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`;
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Локально создайте `F:\learn-bot\.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`SUPABASE_SERVICE_ROLE_KEY` для этого приложения **не обязателен** (все операции идут от имени пользователя через anon + RLS).

## 3. Vercel

1. [https://vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Import** репозиторий GitHub → выберите `learn-bot`.
3. **Root Directory** оставьте корнем репозитория (если монорепо — укажите подпапку).
4. **Environment Variables** — добавьте те же три переменные, что и в `.env.local` (для Preview и Production).
5. **Deploy**.

После деплоя откройте выданный URL (`*.vercel.app`). Убедитесь, что в Supabase в **Authentication** → **URL Configuration** добавлены:

- **Site URL**: `https://<ваш-проект>.vercel.app`
- **Redirect URLs**: тот же URL и при необходимости `http://localhost:3000` для разработки.

## 4. Локальный запуск

```bash
cd F:\learn-bot
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## 5. Чеклист после деплоя

- [ ] Миграция SQL применена в Supabase.
- [ ] Email без подтверждения (если нужен мгновенный вход).
- [ ] Переменные окружения на Vercel совпадают с локальными.
- [ ] В Supabase указаны URL сайта и redirect для продакшена.

### Ошибка: «No Output Directory named public»

Сборка Next.js проходит, а деплой падает — в настройках проекта на Vercel выбран не тот тип (часто **Other** / статика) или задан **Output Directory** = `public`.

В корне репозитория добавлен `vercel.json` с `"framework": "nextjs"` — закоммитьте и запушьте. Дополнительно в Vercel: **Settings → Build & Deployment** — **Framework Preset: Next.js**, для **Output Directory** выключите override (пусто).

Если остались старые overrides: в том же разделе используйте **Reset** / сброс к настройкам проекта для Production.
