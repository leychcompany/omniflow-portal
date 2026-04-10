-- Location is set per training session (class), not on the course catalog row.
ALTER TABLE courses
  DROP COLUMN IF EXISTS location;
