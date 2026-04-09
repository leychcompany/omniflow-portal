-- Where the course is held (city, facility, or "Online")
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN courses.location IS 'Typical or default location (city, facility, Online)';
