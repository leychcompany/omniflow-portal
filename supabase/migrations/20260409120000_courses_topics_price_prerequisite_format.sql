-- Extended course metadata: topics, pricing, delivery format, prerequisite course link
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS topics TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS early_bird_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS prerequisite_course_id TEXT REFERENCES courses (id) ON DELETE SET NULL;

COMMENT ON COLUMN courses.topics IS 'Freeform or multiline list of course topics';
COMMENT ON COLUMN courses.price IS 'Standard price (same currency as displayed in UI)';
COMMENT ON COLUMN courses.early_bird_price IS 'Optional early-bird price';
COMMENT ON COLUMN courses.format IS 'e.g. In-person, Virtual, Hybrid';
COMMENT ON COLUMN courses.prerequisite_course_id IS 'Optional prerequisite course (same catalog)';
