-- Phase 1A: Transactional Session Completion
-- Ensures session.status and student.last_session_date are updated atomically
-- Database is authoritative for all session timestamps (scheduled_start)
-- Last_session_date is set to session.scheduled_start (actual session time, not completion time)
-- Only moves last_session_date forward to prevent backward movement from later completions

CREATE OR REPLACE FUNCTION public.complete_session_atomic(p_session_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_session_record RECORD;
  v_result JSONB;
BEGIN
  -- Get the session record and verify it exists and belongs to current user
  -- RLS policies enforce ownership at row level
  SELECT id, student_id, owner_id, scheduled_start, status
  INTO v_session_record
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Verify ownership (mirrors server-side check as defense in depth)
  IF v_session_record.owner_id != public.auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Mark session as completed using server-provided timestamp
  UPDATE public.sessions
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_session_id;

  -- Update student's last_session_date using session's scheduled_start (database source of truth)
  -- Only moves forward: prevent last_session_date from moving backward if older session completes later
  UPDATE public.students
  SET last_session_date = v_session_record.scheduled_start
  WHERE id = v_session_record.student_id
    AND (last_session_date IS NULL OR v_session_record.scheduled_start > last_session_date);

  -- Return the updated session with all server-provided timestamps
  SELECT jsonb_build_object(
    'id', id,
    'student_id', student_id,
    'status', status,
    'completed_at', completed_at
  )
  INTO v_result
  FROM public.sessions
  WHERE id = p_session_id;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_session_atomic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_session_atomic(uuid) TO authenticated;
