-- Enrollment details collected at portal signup / waitlist (snapshot per registration)

ALTER TABLE public.training_registrations
  ADD COLUMN IF NOT EXISTS certificate_company_name TEXT,
  ADD COLUMN IF NOT EXISTS work_title TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS food_restrictions TEXT;

COMMENT ON COLUMN public.training_registrations.certificate_company_name IS 'Company name as it should appear on the certificate';
COMMENT ON COLUMN public.training_registrations.work_title IS 'Attendee work title at signup';
COMMENT ON COLUMN public.training_registrations.first_name IS 'First name snapshot at signup';
COMMENT ON COLUMN public.training_registrations.last_name IS 'Last name snapshot at signup';
