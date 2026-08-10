-- Phase 1A: Transactional Session Completion
-- Ensures session.status and student.last_session_date are updated atomically
-- last_session_date is set to session.scheduled_start to represent the actual session time
-- Only updates last_session_date if the session being completed is more recent than existing value

CREATE OR REPLACE FUNCTION complete_session_atomic(
  p_session_id uuid,
  p_scheduled_start timestamptz
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_record RECORD;
  v_result JSONB;
BEGIN
  -- Get the session record and verify it exists and belongs to current user
  SELECT id, student_id, owner_id, scheduled_start, status
  INTO v_session_record
  FROM sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_session_record IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session_record.owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Mark session as completed
  UPDATE sessions
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_session_id;

  -- Update student's last_session_date only if this session's scheduled_start is more recent
  -- This prevents newer completion timestamps from appearing older than actual session time
  UPDATE students
  SET last_session_date = v_session_record.scheduled_start
  WHERE id = v_session_record.student_id
    AND (last_session_date IS NULL OR v_session_record.scheduled_start > last_session_date);

  -- Return the updated session
  SELECT jsonb_build_object(
    'id', id,
    'student_id', student_id,
    'status', status,
    'completed_at', completed_at
  )
  INTO v_result
  FROM sessions
  WHERE id = p_session_id;

  RETURN v_result;
END;
$$;
