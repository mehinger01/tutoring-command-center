'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSession } from '@/server/actions/sessions';
import { getClientErrorMessage } from '@/lib/errors/app-error';

export default function NewSessionPage({
  params,
}: {
  params: { studentId: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    scheduled_start: '',
    scheduled_end: '',
    status: 'planned',
    planned_focus: '',
    pre_session_notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createSession(params.studentId, {
        scheduled_start: formData.scheduled_start ? new Date(formData.scheduled_start) : new Date(),
        scheduled_end: formData.scheduled_end ? new Date(formData.scheduled_end) : new Date(),
        status: formData.status,
        planned_focus: formData.planned_focus || undefined,
        pre_session_notes: formData.pre_session_notes || undefined,
      });

      router.push(`/dashboard/students/${params.studentId}/sessions`);
    } catch (err) {
      setError(getClientErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/students/${params.studentId}/sessions`}
          className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Sessions
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Schedule New Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Details</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="scheduled_start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date & Time *
              </label>
              <input
                id="scheduled_start"
                name="scheduled_start"
                type="datetime-local"
                required
                value={formData.scheduled_start}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="scheduled_end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date & Time *
              </label>
              <input
                id="scheduled_end"
                name="scheduled_end"
                type="datetime-local"
                required
                value={formData.scheduled_end}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="planned">Planned</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          <div>
            <label htmlFor="planned_focus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Planned Focus
            </label>
            <textarea
              id="planned_focus"
              name="planned_focus"
              rows={3}
              value={formData.planned_focus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="What will you focus on in this session?"
            />
          </div>

          <div>
            <label htmlFor="pre_session_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pre-Session Notes
            </label>
            <textarea
              id="pre_session_notes"
              name="pre_session_notes"
              rows={2}
              value={formData.pre_session_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Any notes before the session starts"
            />
          </div>
        </div>

        <div className="flex gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
          </button>
          <Link
            href={`/dashboard/students/${params.studentId}/sessions`}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
