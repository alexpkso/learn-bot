-- Исправляет сбой регистрации с сообщением вроде "Database error saving new user":
-- триггер на auth.users не мог завершить INSERT в public.profiles / progress (права / синтаксис триггера).

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.progress TO supabase_auth_admin;

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
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Выполняется от имени владельца функции; в Supabase обычно есть роль postgres.
DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.handle_new_user() OWNER TO postgres';
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
