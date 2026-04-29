-- Per-day schedule for training_sessions.
-- A class is now an explicit list of days (date + start time + end time + optional label).
-- training_sessions.starts_at / ends_at are kept and auto-derived from days
-- (first day's start, last day's end) so existing cron, sorting, and reads continue to work.

CREATE TABLE IF NOT EXISTS training_session_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  day_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT training_session_days_time_order CHECK (end_time > start_time),
  CONSTRAINT training_session_days_position_unique UNIQUE (session_id, position)
);

CREATE INDEX IF NOT EXISTS idx_training_session_days_session
  ON training_session_days(session_id);
CREATE INDEX IF NOT EXISTS idx_training_session_days_session_date
  ON training_session_days(session_id, day_date, position);

-- Recompute training_sessions.starts_at / ends_at from its days, in the class timezone.
CREATE OR REPLACE FUNCTION public.training_session_sync_window(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tz TEXT;
  v_start_date DATE;
  v_end_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_starts TIMESTAMPTZ;
  v_ends TIMESTAMPTZ;
BEGIN
  SELECT timezone INTO v_tz FROM training_sessions WHERE id = p_session_id;
  IF v_tz IS NULL THEN RETURN; END IF;

  SELECT day_date, start_time INTO v_start_date, v_start_time
  FROM training_session_days
  WHERE session_id = p_session_id
  ORDER BY day_date ASC, position ASC, created_at ASC
  LIMIT 1;

  SELECT day_date, end_time INTO v_end_date, v_end_time
  FROM training_session_days
  WHERE session_id = p_session_id
  ORDER BY day_date DESC, position DESC, created_at DESC
  LIMIT 1;

  IF v_start_date IS NULL THEN
    -- No days; leave starts_at/ends_at untouched (starts_at is NOT NULL).
    RETURN;
  END IF;

  v_starts := (v_start_date::text || ' ' || v_start_time::text)::timestamp AT TIME ZONE v_tz;
  v_ends   := (v_end_date::text   || ' ' || v_end_time::text)::timestamp   AT TIME ZONE v_tz;

  UPDATE training_sessions
  SET starts_at = v_starts,
      ends_at   = v_ends
  WHERE id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.training_session_days_sync_trg()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.training_session_sync_window(OLD.session_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.session_id IS DISTINCT FROM NEW.session_id THEN
    PERFORM public.training_session_sync_window(OLD.session_id);
    PERFORM public.training_session_sync_window(NEW.session_id);
    RETURN NEW;
  ELSE
    PERFORM public.training_session_sync_window(NEW.session_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS training_session_days_sync ON training_session_days;
CREATE TRIGGER training_session_days_sync
  AFTER INSERT OR UPDATE OR DELETE ON training_session_days
  FOR EACH ROW EXECUTE FUNCTION public.training_session_days_sync_trg();

-- When training_sessions.timezone changes, recompute starts_at/ends_at from existing days.
CREATE OR REPLACE FUNCTION public.training_sessions_tz_sync_trg()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.timezone IS DISTINCT FROM OLD.timezone THEN
    PERFORM public.training_session_sync_window(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS training_sessions_tz_sync ON training_sessions;
CREATE TRIGGER training_sessions_tz_sync
  AFTER UPDATE OF timezone ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.training_sessions_tz_sync_trg();

ALTER TABLE training_session_days ENABLE ROW LEVEL SECURITY;

-- Backfill: create one row per calendar day in the existing [starts_at..ends_at] window,
-- using the same start_time / end_time on every day (the previous "each day" inference).
DO $$
DECLARE
  s RECORD;
  v_start_date DATE;
  v_end_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_pos INT;
  d DATE;
BEGIN
  FOR s IN
    SELECT id, starts_at, ends_at, timezone
    FROM training_sessions ts
    WHERE NOT EXISTS (
      SELECT 1 FROM training_session_days WHERE session_id = ts.id
    )
  LOOP
    v_start_date := (s.starts_at AT TIME ZONE s.timezone)::date;
    v_start_time := (s.starts_at AT TIME ZONE s.timezone)::time;
    IF s.ends_at IS NULL THEN
      v_end_date := v_start_date;
      v_end_time := (v_start_time + INTERVAL '1 hour')::time;
    ELSE
      v_end_date := (s.ends_at AT TIME ZONE s.timezone)::date;
      v_end_time := (s.ends_at AT TIME ZONE s.timezone)::time;
    END IF;

    -- Guard against bad data so we don't violate the time_order CHECK.
    IF v_end_time <= v_start_time THEN
      v_end_time := (v_start_time + INTERVAL '1 hour')::time;
    END IF;

    v_pos := 0;
    d := v_start_date;
    WHILE d <= v_end_date LOOP
      INSERT INTO training_session_days (session_id, position, day_date, start_time, end_time)
      VALUES (s.id, v_pos, d, v_start_time, v_end_time);
      v_pos := v_pos + 1;
      d := d + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE training_session_days IS
  'Explicit day-by-day schedule for a training_session. starts_at/ends_at on training_sessions are derived (first day start, last day end).';
