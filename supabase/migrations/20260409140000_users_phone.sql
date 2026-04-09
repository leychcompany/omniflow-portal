-- Store phone collected at self-registration (user_metadata.phone)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB;
  fname TEXT;
  lname TEXT;
  comp TEXT;
  job_title TEXT;
  phone_val TEXT;
  is_self_register BOOLEAN;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  fname := meta->>'first_name';
  lname := meta->>'last_name';
  comp := meta->>'company';
  job_title := meta->>'title';
  phone_val := NULLIF(TRIM(COALESCE(meta->>'phone', '')), '');
  is_self_register := (fname IS NOT NULL OR lname IS NOT NULL OR comp IS NOT NULL OR job_title IS NOT NULL OR phone_val IS NOT NULL);

  INSERT INTO public.users (id, email, name, role, first_name, last_name, company, title, phone, locked, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(TRIM(COALESCE(fname, '') || ' ' || COALESCE(lname, '')), meta->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'client',
    NULLIF(TRIM(fname), ''),
    NULLIF(TRIM(lname), ''),
    NULLIF(TRIM(comp), ''),
    NULLIF(TRIM(job_title), ''),
    phone_val,
    is_self_register,
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    company = COALESCE(EXCLUDED.company, users.company),
    title = COALESCE(EXCLUDED.title, users.title),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    locked = CASE WHEN EXCLUDED.locked THEN EXCLUDED.locked ELSE users.locked END,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.users SET
      first_name = COALESCE(NULLIF(TRIM(fname), ''), first_name),
      last_name = COALESCE(NULLIF(TRIM(lname), ''), last_name),
      company = COALESCE(NULLIF(TRIM(comp), ''), company),
      title = COALESCE(NULLIF(TRIM(job_title), ''), title),
      phone = COALESCE(phone_val, phone),
      locked = CASE WHEN is_self_register THEN true ELSE locked END,
      updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
