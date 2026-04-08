-- Admin roster: scheduled vs confirmed (does not replace registration/waitlist status)

ALTER TABLE training_registrations
  ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'scheduled'
  CHECK (attendance_status IN ('scheduled', 'confirmed'));

COMMENT ON COLUMN training_registrations.attendance_status IS 'Roster tracking: scheduled or confirmed attendance. Independent of registered/waitlisted.';
