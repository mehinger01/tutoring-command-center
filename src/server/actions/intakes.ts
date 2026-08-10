'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudentById } from './students';
import { AppError, ErrorCode } from '@/lib/errors/app-error';
import {
  createIntakeSchema,
  updateIntakeSchema,
  CreateIntakeInput,
  UpdateIntakeInput,
} from '@/lib/validation/students';

export async function createIntake(studentId: string, input: unknown) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify student belongs to user
  const student = await getStudentById(studentId);
  if (student.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const validated = createIntakeSchema.parse(input);

  const { data, error } = await supabase
    .from('student_intakes')
    .insert({
      owner_id: user.id,
      student_id: studentId,
      referral_source: validated.referral_source || null,
      parent_concerns: validated.parent_concerns || null,
      student_concerns: validated.student_concerns || null,
      academic_needs: validated.academic_needs || null,
      executive_function_needs: validated.executive_function_needs || null,
      student_interests: validated.student_interests || null,
      accommodations: validated.accommodations || null,
      initial_goals: validated.initial_goals || null,
      assessment_plan: validated.assessment_plan || null,
      package_notes: validated.package_notes || null,
      scheduling_expectations: validated.scheduling_expectations || null,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create intake: ${error.message}`, ErrorCode.INTERNAL_ERROR, 500);
  }

  return data;
}

export async function getIntakes(studentId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify student belongs to user
  const student = await getStudentById(studentId);
  if (student.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const { data, error } = await supabase
    .from('student_intakes')
    .select('*')
    .eq('student_id', studentId)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch intakes: ${error.message}`, ErrorCode.INTERNAL_ERROR, 500);
  }

  return data || [];
}

export async function getIntakeById(intakeId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const { data, error } = await supabase
    .from('student_intakes')
    .select('*')
    .eq('id', intakeId)
    .eq('owner_id', user.id)
    .single();

  if (error?.code === 'PGRST116') {
    throw new AppError('Intake not found', ErrorCode.NOT_FOUND, 404);
  }

  if (error) {
    throw new AppError(`Failed to fetch intake: ${error.message}`, ErrorCode.INTERNAL_ERROR, 500);
  }

  return data;
}

export async function updateIntake(intakeId: string, input: unknown) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify ownership
  const intake = await getIntakeById(intakeId);
  if (intake.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const validated = updateIntakeSchema.parse(input);

  const { data, error } = await supabase
    .from('student_intakes')
    .update({
      referral_source: validated.referral_source,
      parent_concerns: validated.parent_concerns,
      student_concerns: validated.student_concerns,
      academic_needs: validated.academic_needs,
      executive_function_needs: validated.executive_function_needs,
      student_interests: validated.student_interests,
      accommodations: validated.accommodations,
      initial_goals: validated.initial_goals,
      assessment_plan: validated.assessment_plan,
      package_notes: validated.package_notes,
      scheduling_expectations: validated.scheduling_expectations,
    })
    .eq('id', intakeId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update intake: ${error.message}`, ErrorCode.INTERNAL_ERROR, 500);
  }

  return data;
}
