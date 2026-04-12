-- NovoPrint Language App — initial schema (generic multi-user)

-- Profiles (created by trigger on signup + user updates)
CREATE TABLE public.profiles (
  id               UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT 'Ученик',
  native_language  TEXT DEFAULT 'ru',
  target_language  TEXT DEFAULT 'sr',
  onboarding       JSONB,
  onboarding_done  BOOLEAN DEFAULT FALSE,
  started_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.progress (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  xp             INTEGER DEFAULT 0,
  current_module INTEGER DEFAULT 0,
  last_pecat     INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.words (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  serbian        TEXT NOT NULL,
  russian        TEXT NOT NULL,
  topic          TEXT,
  status         TEXT DEFAULT 'new',
  error_count    INTEGER DEFAULT 0,
  streak         INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX words_user_next ON public.words (user_id, next_review_at);

CREATE TABLE public.sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  module     INTEGER NOT NULL,
  pecat      INTEGER,
  xp_earned  INTEGER DEFAULT 0,
  summary    TEXT,
  messages   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX sessions_user_created ON public.sessions (user_id, created_at DESC);

CREATE TABLE public.programs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,
  status      TEXT DEFAULT 'draft',
  modules     JSONB NOT NULL,
  user_notes  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX programs_user ON public.programs (user_id, created_at DESC);

CREATE TABLE public.voice_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcript      TEXT,
  detected_lang   TEXT,
  claude_response TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- New user → profile + progress
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Ученик')
  );
  INSERT INTO public.progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "progress_all_own" ON public.progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "words_all_own" ON public.words FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sessions_all_own" ON public.sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "programs_all_own" ON public.programs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "voice_sessions_all_own" ON public.voice_sessions FOR ALL
  USING (auth.uid() = user_id);
