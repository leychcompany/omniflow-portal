-- Instructor on scheduled classes; admin can enroll existing portal users (users row required).

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS instructor TEXT;

COMMENT ON COLUMN training_sessions.instructor IS 'Display name for who teaches this scheduled instance (not the catalog course).';

-- Enroll an existing portal user; bypasses registration window and draft/open rules except cancelled.
-- Same seat / waitlist rules as public registration.
CREATE OR REPLACE FUNCTION public.admin_add_user_to_training_session(p_session_id uuid, p_user_id uuid)
RETURNS TABLE(out_registration_id uuid, out_status text, out_waitlist_position int, out_error text)
LANGUAGE plpgsql
AS $$
DECLARE
  sess training_sessions%ROWTYPE;
  reg_count int;
  next_pos int;
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'No portal account found for this user. Add or invite them under Admin → Users first.'::text;
    RETURN;
  END IF;

  SELECT * INTO sess FROM training_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'Session not found'::text;
    RETURN;
  END IF;

  IF sess.status = 'cancelled' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'Session is cancelled'::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM training_registrations tr
    WHERE tr.session_id = p_session_id AND tr.user_id = p_user_id
      AND tr.status IN ('registered', 'waitlisted')
  ) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'User is already registered or on the waitlist'::text;
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO reg_count FROM training_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  IF reg_count < sess.capacity THEN
    new_id := gen_random_uuid();
    INSERT INTO training_registrations (id, session_id, user_id, status, waitlist_position)
    VALUES (new_id, p_session_id, p_user_id, 'registered', NULL);
    IF reg_count + 1 >= sess.capacity THEN
      UPDATE training_sessions SET status = 'full' WHERE id = p_session_id AND status IN ('draft', 'open');
    END IF;
    RETURN QUERY SELECT new_id, 'registered'::text, NULL::int, NULL::text;
    RETURN;
  END IF;

  IF sess.waitlist_enabled THEN
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO next_pos FROM training_registrations
    WHERE session_id = p_session_id AND status = 'waitlisted';
    new_id := gen_random_uuid();
    INSERT INTO training_registrations (id, session_id, user_id, status, waitlist_position)
    VALUES (new_id, p_session_id, p_user_id, 'waitlisted', next_pos);
    RETURN QUERY SELECT new_id, 'waitlisted'::text, next_pos, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::int, 'This class is full and waitlist is disabled'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_user_to_training_session(uuid, uuid) TO service_role;
