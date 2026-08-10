import { z } from 'zod';

export const studentStatusSchema = z.enum(['intake', 'active', 'paused', 'archived']);

export const createStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().max(255).nullable().optional(),
  preferred_name: z.string().max(255).nullable().optional(),
  status: studentStatusSchema.default('intake'),
  grade_level: z.string().max(255).nullable().optional(),
  school_name: z.string().max(255).nullable().optional(),
  tutoring_type: z.array(z.string()).nullable().optional(),
  subjects: z.array(z.string()).nullable().optional(),
  parent_guardian_name: z.string().max(255).nullable().optional(),
  parent_guardian_email: z.string().email().max(255).nullable().optional(),
  parent_guardian_phone: z.string().max(20).nullable().optional(),
  student_email: z.string().email().max(255).nullable().optional(),
  current_priorities: z.string().nullable().optional(),
  scheduling_notes: z.string().nullable().optional(),
  tutor_notes: z.string().nullable().optional(),
  student_site_url: z.string().url().nullable().optional(),
  github_repo_url: z.string().url().nullable().optional(),
  external_platform_notes: z.string().nullable().optional(),
  start_date: z.coerce.date().nullable().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({
  // owner_id and created_at are never user-modifiable
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const createIntakeSchema = z.object({
  referral_source: z.string().max(255).nullable().optional(),
  parent_concerns: z.string().nullable().optional(),
  student_concerns: z.string().nullable().optional(),
  academic_needs: z.string().nullable().optional(),
  executive_function_needs: z.string().nullable().optional(),
  student_interests: z.string().nullable().optional(),
  accommodations: z.string().nullable().optional(),
  initial_goals: z.string().nullable().optional(),
  assessment_plan: z.string().nullable().optional(),
  package_notes: z.string().nullable().optional(),
  scheduling_expectations: z.string().nullable().optional(),
});

export const updateIntakeSchema = createIntakeSchema.partial();

export type CreateIntakeInput = z.infer<typeof createIntakeSchema>;
export type UpdateIntakeInput = z.infer<typeof updateIntakeSchema>;

export const sessionStatusSchema = z.enum(['planned', 'ready', 'completed', 'cancelled', 'no_show']);

export const createSessionSchema = z.object({
  scheduled_start: z.coerce.date(),
  scheduled_end: z.coerce.date(),
  status: sessionStatusSchema.default('planned'),
  planned_focus: z.string().nullable().optional(),
  actual_focus: z.string().nullable().optional(),
  pre_session_notes: z.string().nullable().optional(),
  session_notes: z.string().nullable().optional(),
  parent_summary: z.string().nullable().optional(),
  next_steps: z.string().nullable().optional(),
  follow_up_tasks: z.string().nullable().optional(),
  lesson_url: z.string().url().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
}).refine((data) => data.scheduled_end > data.scheduled_start, {
  message: 'Session end must be after start',
  path: ['scheduled_end'],
});

export const updateSessionSchema = createSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
