'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSession, completeSession } from '@/server/actions/sessions';
import { getClientErrorMessage } from '@/lib/errors/app-error';

interface Session {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  planned_focus?: string | null;
  actual_focus?: string | null;
  pre_session_notes?: string | null;
  session_notes?: string | null;
  parent_summary?: string | null;
  next_steps?: string | null;
  follow_up_tasks?: string | null;
  lesson_url?: string | null;
  duration_minutes?: number | null;
}

export function SessionDetailContent({ session }: { session: Session }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    planned_focus: session.planned_focus || '',
    actual_focus: session.actual_focus || '',
    pre_session_notes: session.pre_session_notes || '',
    session_notes: session.session_notes || '',
    parent_summary: session.parent_summary || '',
    next_steps: session.next_steps || '',
    follow_up_tasks: session.follow_up_tasks || '',
    lesson_url: session.lesson_url || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await updateSession(session.id, {
        planned_focus: formData.planned_focus || undefined,
        actual_focus: formData.actual_focus || undefined,
        pre_session_notes: formData.pre_session_notes || undefined,
        session_notes: formData.session_notes || undefined,
        parent_summary: formData.parent_summary || undefined,
        next_steps: formData.next_steps || undefined,
        follow_up_tasks: formData.follow_up_tasks || undefined,
        lesson_url: formData.lesson_url || undefined,
      });

      setSuccess(true);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(getClientErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this session as completed?')) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await completeSession(session.id);
      router.refresh();
    } catch (err) {
      setError(getClientErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          Session updated successfully!
        </div>
      )}

      {/* Status and Actions */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
              session.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                : session.status === 'planned'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                  : session.status === 'ready'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            }`}
          >
            {session.status}
          </span>
        </div>
        <div className="flex gap-2">
          {session.status !== 'completed' &&
            session.status !== 'cancelled' &&
            session.status !== 'no_show' && (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Completing...' : 'Complete'}
              </button>
            )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Session Overview */}
      {!isEditing && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Session Schedule
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Start:
                </span>{' '}
                {new Date(session.scheduled_start).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  End:
                </span>{' '}
                {new Date(session.scheduled_end).toLocaleString()}
              </div>
              {session.duration_minutes && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Duration:
                  </span>{' '}
                  {session.duration_minutes} minutes
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Focus & Notes
            </h2>
            <div className="space-y-3 text-sm">
              {session.planned_focus && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Planned Focus:
                  </span>{' '}
                  {session.planned_focus}
                </div>
              )}
              {session.actual_focus && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Actual Focus:
                  </span>{' '}
                  {session.actual_focus}
                </div>
              )}
              {session.pre_session_notes && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Pre-Session Notes:
                  </span>{' '}
                  {session.pre_session_notes}
                </div>
              )}
            </div>
          </div>

          {(session.session_notes ||
            session.parent_summary ||
            session.next_steps) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Session Summary
              </h2>
              <div className="space-y-3 text-sm">
                {session.session_notes && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Notes:
                    </span>{' '}
                    {session.session_notes}
                  </div>
                )}
                {session.parent_summary && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Parent Summary:
                    </span>{' '}
                    {session.parent_summary}
                  </div>
                )}
                {session.next_steps && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Next Steps:
                    </span>{' '}
                    {session.next_steps}
                  </div>
                )}
              </div>
            </div>
          )}

          {(session.follow_up_tasks || session.lesson_url) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Follow-up
              </h2>
              <div className="space-y-3 text-sm">
                {session.follow_up_tasks && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Tasks:
                    </span>{' '}
                    {session.follow_up_tasks}
                  </div>
                )}
                {session.lesson_url && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Lesson:
                    </span>{' '}
                    <a
                      href={session.lesson_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {session.lesson_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <label
              htmlFor="planned_focus"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Planned Focus
            </label>
            <textarea
              id="planned_focus"
              name="planned_focus"
              rows={2}
              value={formData.planned_focus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="actual_focus"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Actual Focus
            </label>
            <textarea
              id="actual_focus"
              name="actual_focus"
              rows={2}
              value={formData.actual_focus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="pre_session_notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Pre-Session Notes
            </label>
            <textarea
              id="pre_session_notes"
              name="pre_session_notes"
              rows={2}
              value={formData.pre_session_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="session_notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Session Notes
            </label>
            <textarea
              id="session_notes"
              name="session_notes"
              rows={2}
              value={formData.session_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="parent_summary"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Parent Summary
            </label>
            <textarea
              id="parent_summary"
              name="parent_summary"
              rows={2}
              value={formData.parent_summary}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="next_steps"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Next Steps
            </label>
            <textarea
              id="next_steps"
              name="next_steps"
              rows={2}
              value={formData.next_steps}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="follow_up_tasks"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Follow-up Tasks
            </label>
            <textarea
              id="follow_up_tasks"
              name="follow_up_tasks"
              rows={2}
              value={formData.follow_up_tasks}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="lesson_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Lesson URL
            </label>
            <input
              id="lesson_url"
              name="lesson_url"
              type="url"
              value={formData.lesson_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
