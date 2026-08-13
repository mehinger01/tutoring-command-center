-- Phase 1A Corrective Migration: Remove unnecessary SECURITY DEFINER from trigger functions
-- Trigger functions should use SECURITY INVOKER (default) to avoid unnecessary exposure

-- Drop existing triggers (which depend on functions)
DROP TRIGGER IF EXISTS students_updated_at_trigger ON public.students;
DROP TRIGGER IF EXISTS student_intakes_updated_at_trigger ON public.student_intakes;
DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON public.sessions;

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS public.update_students_updated_at();
DROP FUNCTION IF EXISTS public.update_student_intakes_updated_at();
DROP FUNCTION IF EXISTS public.update_sessions_updated_at();

-- Recreate without SECURITY DEFINER (trigger functions don't need it)
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
