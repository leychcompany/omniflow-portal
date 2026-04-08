-- Instructor applies to scheduled training_sessions, not catalog courses.
ALTER TABLE courses DROP COLUMN IF EXISTS instructor;
