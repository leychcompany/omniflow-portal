-- Instructor is not stored on scheduled classes.
ALTER TABLE training_sessions
  DROP COLUMN IF EXISTS instructor;
