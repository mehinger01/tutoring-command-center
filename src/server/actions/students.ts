'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/actions';
import { AppError, ErrorCode } from '@/lib/errors/app-error';
import {
  createStudentSchema,
  updateStudentSchema,
} from '@/lib/validation/students';

export async function createStudent(input: unknown) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const validated = createStudentSchema.parse(input);

  const { data, error } = await supabase
    .from('students')
    .insert({
      owner_id: user.id,
      first_name: validated.first_name,
      last_name: validated.last_name || null,
      preferred_name: validated.preferred_name || null,
      status: validated.status,
      grade_level: validated.grade_level || null,
      school_name: validated.school_name || null,
      tutoring_type: validated.tutoring_type || null,
      subjects: validated.subjects || null,
      parent_guardian_name: validated.parent_guardian_name || null,
      parent_guardian_email: validated.parent_guardian_email || null,
      parent_guardian_phone: validated.parent_guardian_phone || null,
      student_email: validated.student_email || null,
      current_priorities: validated.current_priorities || null,
      scheduling_notes: validated.scheduling_notes || null,
      tutor_notes: validated.tutor_notes || null,
      student_site_url: validated.student_site_url || null,
      github_repo_url: validated.github_repo_url || null,
      external_platform_notes: validated.external_platform_notes || null,
      start_date: validated.start_date || null,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to create student: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function getStudents() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('owner_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(
      `Failed to fetch students: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data || [];
}

export async function getStudentById(studentId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('owner_id', user.id)
    .single();

  if (error?.code === 'PGRST116') {
    throw new AppError('Student not found', ErrorCode.NOT_FOUND, 404);
  }

  if (error) {
    throw new AppError(
      `Failed to fetch student: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function updateStudent(studentId: string, input: unknown) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify ownership
  const student = await getStudentById(studentId);
  if (student.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const validated = updateStudentSchema.parse(input);

  const { data, error } = await supabase
    .from('students')
    .update({
      first_name: validated.first_name,
      last_name: validated.last_name,
      preferred_name: validated.preferred_name,
      status: validated.status,
      grade_level: validated.grade_level,
      school_name: validated.school_name,
      tutoring_type: validated.tutoring_type,
      subjects: validated.subjects,
      parent_guardian_name: validated.parent_guardian_name,
      parent_guardian_email: validated.parent_guardian_email,
      parent_guardian_phone: validated.parent_guardian_phone,
      student_email: validated.student_email,
      current_priorities: validated.current_priorities,
      scheduling_notes: validated.scheduling_notes,
      tutor_notes: validated.tutor_notes,
      student_site_url: validated.student_site_url,
      github_repo_url: validated.github_repo_url,
      external_platform_notes: validated.external_platform_notes,
      start_date: validated.start_date,
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to update student: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function archiveStudent(studentId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify ownership
  const student = await getStudentById(studentId);
  if (student.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const { data, error } = await supabase
    .from('students')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to archive student: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function unarchiveStudent(studentId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify ownership
  const student = await getStudentById(studentId);
  if (student.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const { data, error } = await supabase
    .from('students')
    .update({
      status: 'active',
      archived_at: null,
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to unarchive student: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}
