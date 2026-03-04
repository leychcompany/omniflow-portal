-- B2B User Registration: Add columns and trigger for self-registration with locked mode

-- Add new columns to users table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'first_name') THEN
    ALTER TABLE users ADD COLUMN first_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name') THEN
    ALTER TABLE users ADD COLUMN last_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'company') THEN
    ALTER TABLE users ADD COLUMN company TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'title') THEN
    ALTER TABLE users ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'locked') THEN
    ALTER TABLE users ADD COLUMN locked BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Backfill: existing users should not be locked
UPDATE users SET locked = false WHERE locked IS NULL;

-- Trigger function: create users row when new auth user is created (self-registration or invite)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB;
  fname TEXT;
  lname TEXT;
  comp TEXT;
  job_title TEXT;
  is_self_register BOOLEAN;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  fname := meta->>'first_name';
  lname := meta->>'last_name';
  comp := meta->>'company';
  job_title := meta->>'title';
  is_self_register := (fname IS NOT NULL OR lname IS NOT NULL OR comp IS NOT NULL OR job_title IS NOT NULL);

  INSERT INTO public.users (id, email, name, role, first_name, last_name, company, title, locked, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(TRIM(COALESCE(fname, '') || ' ' || COALESCE(lname, '')), meta->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'client',
    NULLIF(TRIM(fname), ''),
    NULLIF(TRIM(lname), ''),
    NULLIF(TRIM(comp), ''),
    NULLIF(TRIM(job_title), ''),
    is_self_register,
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    company = COALESCE(EXCLUDED.company, users.company),
    title = COALESCE(EXCLUDED.title, users.title),
    locked = CASE WHEN EXCLUDED.locked THEN EXCLUDED.locked ELSE users.locked END,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Row already exists (e.g. from invite ensureProfile), update B2B fields if we have them
    UPDATE public.users SET
      first_name = COALESCE(NULLIF(TRIM(fname), ''), first_name),
      last_name = COALESCE(NULLIF(TRIM(lname), ''), last_name),
      company = COALESCE(NULLIF(TRIM(comp), ''), company),
      title = COALESCE(NULLIF(TRIM(job_title), ''), title),
      locked = CASE WHEN is_self_register THEN true ELSE locked END,
      updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
