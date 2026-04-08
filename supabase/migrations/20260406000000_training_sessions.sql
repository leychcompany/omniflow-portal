-- Scheduled training sessions & registrations (portal enroll + waitlist)

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  location TEXT NOT NULL DEFAULT '',
  capacity INT NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'full', 'closed', 'cancelled')),
  waitlist_enabled BOOLEAN NOT NULL DEFAULT true,
  registration_closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_starts_at ON training_sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_training_sessions_course_id ON training_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

CREATE TABLE IF NOT EXISTS training_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  waitlist_position INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_7d_sent_at TIMESTAMPTZ,
  reminder_1d_sent_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS training_registrations_one_active_per_user
  ON training_registrations(session_id, user_id)
  WHERE status IN ('registered', 'waitlisted');

CREATE INDEX IF NOT EXISTS idx_training_registrations_session ON training_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_user ON training_registrations(user_id);

CREATE TRIGGER training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_registrations ENABLE ROW LEVEL SECURITY;

-- After a registered seat is freed: open session if needed, promote first waitlisted → registered
CREATE OR REPLACE FUNCTION public.training_session_after_registered_drop(p_session_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  reg_count int;
  cap int;
  st text;
  wl_record training_registrations%ROWTYPE;
BEGIN
  SELECT capacity, status INTO cap, st FROM training_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::int INTO reg_count FROM training_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  IF st = 'full' AND reg_count < cap THEN
    UPDATE training_sessions SET status = 'open' WHERE id = p_session_id;
  END IF;

  SELECT * INTO wl_record FROM training_registrations
  WHERE session_id = p_session_id AND status = 'waitlisted'
  ORDER BY waitlist_position NULLS LAST, created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE training_registrations
  SET status = 'registered', waitlist_position = NULL
  WHERE id = wl_record.id;

  SELECT COUNT(*)::int INTO reg_count FROM training_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  IF reg_count >= cap THEN
    UPDATE training_sessions SET status = 'full' WHERE id = p_session_id;
  END IF;

  RETURN wl_record.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_for_training_session(p_session_id uuid, p_user_id uuid)
RETURNS TABLE(out_registration_id uuid, out_status text, out_waitlist_position int, out_error text)
LANGUAGE plpgsql
AS $$
DECLARE
  sess training_sessions%ROWTYPE;
  reg_count int;
  next_pos int;
  new_id uuid;
BEGIN
  SELECT * INTO sess FROM training_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'Session not found'::text;
    RETURN;
  END IF;

  IF sess.status IN ('draft', 'cancelled', 'closed') THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'Registration is not open for this class'::text;
    RETURN;
  END IF;

  IF sess.registration_closes_at IS NOT NULL AND sess.registration_closes_at < now() THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'Registration has closed'::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM training_registrations tr
    WHERE tr.session_id = p_session_id AND tr.user_id = p_user_id
      AND tr.status IN ('registered', 'waitlisted')
  ) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'You are already registered or on the waitlist'::text;
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO reg_count FROM training_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  IF reg_count < sess.capacity THEN
    new_id := gen_random_uuid();
    INSERT INTO training_registrations (id, session_id, user_id, status, waitlist_position)
    VALUES (new_id, p_session_id, p_user_id, 'registered', NULL);
    IF reg_count + 1 >= sess.capacity THEN
      UPDATE training_sessions SET status = 'full' WHERE id = p_session_id;
    END IF;
    RETURN QUERY SELECT new_id, 'registered'::text, NULL::int, NULL::text;
    RETURN;
  END IF;

  IF sess.waitlist_enabled AND sess.status IN ('open', 'full') THEN
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO next_pos FROM training_registrations
    WHERE session_id = p_session_id AND status = 'waitlisted';
    new_id := gen_random_uuid();
    INSERT INTO training_registrations (id, session_id, user_id, status, waitlist_position)
    VALUES (new_id, p_session_id, p_user_id, 'waitlisted', next_pos);
    RETURN QUERY SELECT new_id, 'waitlisted'::text, next_pos, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'This class is full'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_my_training_registration(p_session_id uuid, p_user_id uuid)
RETURNS TABLE(out_cancelled_registration_id uuid, out_promoted_user_id uuid, out_error text)
LANGUAGE plpgsql
AS $$
DECLARE
  reg_record training_registrations%ROWTYPE;
  promoted_uid uuid;
BEGIN
  SELECT * INTO reg_record FROM training_registrations
  WHERE session_id = p_session_id AND user_id = p_user_id AND status IN ('registered', 'waitlisted')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::uuid, 'No active registration found'::text;
    RETURN;
  END IF;

  UPDATE training_registrations
  SET status = 'cancelled', waitlist_position = NULL
  WHERE id = reg_record.id;

  IF reg_record.status = 'registered' THEN
    promoted_uid := training_session_after_registered_drop(p_session_id);
    RETURN QUERY SELECT reg_record.id, promoted_uid, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT reg_record.id, NULL::uuid, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_training_session(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_my_training_registration(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.training_session_after_registered_drop(uuid) TO service_role;
