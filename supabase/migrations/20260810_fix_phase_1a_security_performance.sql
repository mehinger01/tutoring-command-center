-- Phase 1A Corrective Migration: Security & Performance Hardening
-- Fixes: function search_path mutable warnings and RLS initialization plan warnings

-- ============================================================================
-- SECURITY FIX: Set explicit search_path on trigger functions
-- ============================================================================

-- Drop existing triggers (which depend on functions)
DROP TRIGGER IF EXISTS students_updated_at_trigger ON public.students;
DROP TRIGGER IF EXISTS student_intakes_updated_at_trigger ON public.student_intakes;
DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON public.sessions;

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS public.update_students_updated_at();
DROP FUNCTION IF EXISTS public.update_student_intakes_updated_at();
DROP FUNCTION IF EXISTS public.update_sessions_updated_at();

-- Recreate with explicit search_path set to 'public'
-- Note: Using SECURITY INVOKER (default) for trigger functions—no need for DEFINER
CREATE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION public.update_student_intakes_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION public.update_sessions_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER students_updated_at_trigger
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_students_updated_at();

CREATE TRIGGER student_intakes_updated_at_trigger
BEFORE UPDATE ON public.student_intakes
FOR EACH ROW
EXECUTE FUNCTION public.update_student_intakes_updated_at();

CREATE TRIGGER sessions_updated_at_trigger
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_sessions_updated_at();

-- ============================================================================
-- PERFORMANCE FIX: Optimize RLS policies to use (select auth.uid())
-- This prevents re-evaluation of auth.uid() for each row
-- ============================================================================

-- Drop existing policies on students table
DROP POLICY IF EXISTS "Users can read own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

-- Drop existing policies on student_intakes table
DROP POLICY IF EXISTS "Users can read own intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Users can insert own intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Users can update own intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Users can delete own intakes" ON public.student_intakes;

-- Drop existing policies on sessions table
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

-- Recreate students table policies with optimized auth.uid() calls
CREATE POLICY "Users can read own students"
  ON public.students
  FOR SELECT
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Users can insert own students"
  ON public.students
  FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own students"
  ON public.students
  FOR UPDATE
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete own students"
  ON public.students
  FOR DELETE
  USING (owner_id = (select auth.uid()));

-- Recreate student_intakes table policies with optimized auth.uid() calls
CREATE POLICY "Users can read own intakes"
  ON public.student_intakes
  FOR SELECT
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Users can insert own intakes"
  ON public.student_intakes
  FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own intakes"
  ON public.student_intakes
  FOR UPDATE
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete own intakes"
  ON public.student_intakes
  FOR DELETE
  USING (owner_id = (select auth.uid()));

-- Recreate sessions table policies with optimized auth.uid() calls
CREATE POLICY "Users can read own sessions"
  ON public.sessions
  FOR SELECT
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Users can insert own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  USING (owner_id = (select auth.uid()));
