-- Phase 1A: Student Lifecycle
-- Creates students, student_intakes, and sessions tables with complete schema, RLS, and triggers

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text,
  preferred_name text,
  status text NOT NULL CHECK (status IN ('intake', 'active', 'paused', 'archived')),
  grade_level text,
  school_name text,
  tutoring_type text[],
  subjects text[],
  parent_guardian_name text,
  parent_guardian_email text,
  parent_guardian_phone text,
  student_email text,
  current_priorities text,
  scheduling_notes text,
  tutor_notes text,
  student_site_url text,
  github_repo_url text,
  external_platform_notes text,
  start_date date,
  last_session_date timestamptz,
  next_session_date timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_students_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create student_intakes table
CREATE TABLE IF NOT EXISTS public.student_intakes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  referral_source text,
  parent_concerns text,
  student_concerns text,
  academic_needs text,
  executive_function_needs text,
  student_interests text,
  accommodations text,
  initial_goals text,
  assessment_plan text,
  package_notes text,
  scheduling_expectations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_intakes_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_intakes_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('planned', 'ready', 'completed', 'cancelled', 'no_show')),
  planned_focus text,
  actual_focus text,
  pre_session_notes text,
  session_notes text,
  parent_summary text,
  next_steps text,
  follow_up_tasks text,
  lesson_url text,
  duration_minutes integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_sessions_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create indexes for query performance
CREATE INDEX idx_students_owner_id ON public.students(owner_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_student_intakes_owner_id ON public.student_intakes(owner_id);
CREATE INDEX idx_student_intakes_student_id ON public.student_intakes(student_id);
CREATE INDEX idx_sessions_owner_id ON public.sessions(owner_id);
CREATE INDEX idx_sessions_student_id ON public.sessions(student_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Users can read own students"
  ON public.students
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own students"
  ON public.students
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own students"
  ON public.students
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own students"
  ON public.students
  FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for student_intakes table
CREATE POLICY "Users can read own intakes"
  ON public.student_intakes
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own intakes"
  ON public.student_intakes
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own intakes"
  ON public.student_intakes
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own intakes"
  ON public.student_intakes
  FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for sessions table
CREATE POLICY "Users can read own sessions"
  ON public.sessions
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  USING (owner_id = auth.uid());

-- Grant privileges to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_intakes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;

-- Create trigger function for updated_at timestamp on students
CREATE OR REPLACE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for students table
CREATE TRIGGER students_updated_at_trigger
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_students_updated_at();

-- Create trigger function for updated_at timestamp on student_intakes
CREATE OR REPLACE FUNCTION public.update_student_intakes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student_intakes table
CREATE TRIGGER student_intakes_updated_at_trigger
BEFORE UPDATE ON public.student_intakes
FOR EACH ROW
EXECUTE FUNCTION public.update_student_intakes_updated_at();

-- Create trigger function for updated_at timestamp on sessions
CREATE OR REPLACE FUNCTION public.update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sessions table
CREATE TRIGGER sessions_updated_at_trigger
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_sessions_updated_at();
