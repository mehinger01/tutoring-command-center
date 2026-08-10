'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudentById } from './students';
import { AppError, ErrorCode } from '@/lib/errors/app-error';
import {
  createSessionSchema,
  updateSessionSchema,
} from '@/lib/validation/students';

export async function createSession(studentId: string, input: unknown) {
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

  const validated = createSessionSchema.parse(input);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      owner_id: user.id,
      student_id: studentId,
      scheduled_start: validated.scheduled_start.toISOString(),
      scheduled_end: validated.scheduled_end.toISOString(),
      status: validated.status,
      planned_focus: validated.planned_focus || null,
      actual_focus: validated.actual_focus || null,
      pre_session_notes: validated.pre_session_notes || null,
      session_notes: validated.session_notes || null,
      parent_summary: validated.parent_summary || null,
      next_steps: validated.next_steps || null,
      follow_up_tasks: validated.follow_up_tasks || null,
      lesson_url: validated.lesson_url || null,
      duration_minutes: validated.duration_minutes || null,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to create session: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function getSessions(studentId: string) {
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
    .from('sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('owner_id', user.id)
    .order('scheduled_start', { ascending: false });

  if (error) {
    throw new AppError(
      `Failed to fetch sessions: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data || [];
}

export async function getSessionById(sessionId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('owner_id', user.id)
    .single();

  if (error?.code === 'PGRST116') {
    throw new AppError('Session not found', ErrorCode.NOT_FOUND, 404);
  }

  if (error) {
    throw new AppError(
      `Failed to fetch session: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function updateSession(sessionId: string, input: unknown) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify ownership
  const session = await getSessionById(sessionId);
  if (session.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const validated = updateSessionSchema.partial().parse(input);

  const updateData: Record<string, unknown> = {};
  if (validated.scheduled_start !== undefined)
    updateData.scheduled_start = validated.scheduled_start.toISOString();
  if (validated.scheduled_end !== undefined)
    updateData.scheduled_end = validated.scheduled_end.toISOString();
  if (validated.status !== undefined) updateData.status = validated.status;
  if (validated.planned_focus !== undefined)
    updateData.planned_focus = validated.planned_focus;
  if (validated.actual_focus !== undefined)
    updateData.actual_focus = validated.actual_focus;
  if (validated.pre_session_notes !== undefined)
    updateData.pre_session_notes = validated.pre_session_notes;
  if (validated.session_notes !== undefined)
    updateData.session_notes = validated.session_notes;
  if (validated.parent_summary !== undefined)
    updateData.parent_summary = validated.parent_summary;
  if (validated.next_steps !== undefined)
    updateData.next_steps = validated.next_steps;
  if (validated.follow_up_tasks !== undefined)
    updateData.follow_up_tasks = validated.follow_up_tasks;
  if (validated.lesson_url !== undefined)
    updateData.lesson_url = validated.lesson_url;
  if (validated.duration_minutes !== undefined)
    updateData.duration_minutes = validated.duration_minutes;

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to update session: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}

export async function completeSession(sessionId: string) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify ownership
  const session = await getSessionById(sessionId);
  if (session.owner_id !== user.id) {
    throw new AppError('Forbidden', ErrorCode.FORBIDDEN, 403);
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to complete session: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  return data;
}
