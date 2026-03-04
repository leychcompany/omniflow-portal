-- Ensure invites table has created_at for Auth Hook (admin invite detection)
-- Idempotent: only add if column doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.invites ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
