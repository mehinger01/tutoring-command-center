-- Phase 1A Corrective Migration: Enforce child/parent ownership in database
-- Prevent User A from creating rows with owner_id = User A but student_id pointing to User B's student

-- ============================================================================
-- STUDENT_INTAKES: Enforce owner_id matches owner of parent student
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Users can insert own intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Users can update own intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Users can delete own intakes" ON public.student_intakes;

-- Recreate policies with ownership verification
-- SELECT: User must own the intake
CREATE POLICY "Users can read own intakes"
  ON public.student_intakes
  FOR SELECT
  USING (owner_id = (select auth.uid()));

-- INSERT: User must own the intake AND be the owner of the linked student
CREATE POLICY "Users can insert own intakes"
  ON public.student_intakes
  FOR INSERT
  WITH CHECK (
    owner_id = (select auth.uid())
    AND owner_id = (
      SELECT owner_id FROM public.students
      WHERE id = student_intakes.student_id
    )
  );

-- UPDATE: User must own the intake and the student
CREATE POLICY "Users can update own intakes"
  ON public.student_intakes
  FOR UPDATE
  USING (owner_id = (select auth.uid()))
  WITH CHECK (
    owner_id = (select auth.uid())
    AND owner_id = (
      SELECT owner_id FROM public.students
      WHERE id = student_intakes.student_id
    )
  );

-- DELETE: User must own the intake
CREATE POLICY "Users can delete own intakes"
  ON public.student_intakes
  FOR DELETE
  USING (owner_id = (select auth.uid()));

-- ============================================================================
-- SESSIONS: Enforce owner_id matches owner of parent student
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

-- Recreate policies with ownership verification
-- SELECT: User must own the session
CREATE POLICY "Users can read own sessions"
  ON public.sessions
  FOR SELECT
  USING (owner_id = (select auth.uid()));

-- INSERT: User must own the session AND be the owner of the linked student
CREATE POLICY "Users can insert own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (
    owner_id = (select auth.uid())
    AND owner_id = (
      SELECT owner_id FROM public.students
      WHERE id = sessions.student_id
    )
  );

-- UPDATE: User must own the session and the student
CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  USING (owner_id = (select auth.uid()))
  WITH CHECK (
    owner_id = (select auth.uid())
    AND owner_id = (
      SELECT owner_id FROM public.students
      WHERE id = sessions.student_id
    )
  );

-- DELETE: User must own the session
CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  USING (owner_id = (select auth.uid()));
