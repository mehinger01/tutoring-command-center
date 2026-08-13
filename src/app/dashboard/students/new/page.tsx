'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createStudent } from '@/server/actions/students';
import { getClientErrorMessage } from '@/lib/errors/app-error';

export default function NewStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preferred_name: '',
    status: 'intake',
    grade_level: '',
    school_name: '',
    parent_guardian_name: '',
    parent_guardian_email: '',
    parent_guardian_phone: '',
    student_email: '',
    current_priorities: '',
    scheduling_notes: '',
    tutor_notes: '',
    tutoring_type: '',
    subjects: '',
    student_site_url: '',
    github_repo_url: '',
    external_platform_notes: '',
    start_date: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
    setIsSubmitting(true);

    try {
      const result = await createStudent({
        first_name: formData.first_name,
        last_name: formData.last_name || undefined,
        preferred_name: formData.preferred_name || undefined,
        status: formData.status,
        grade_level: formData.grade_level || undefined,
        school_name: formData.school_name || undefined,
        parent_guardian_name: formData.parent_guardian_name || undefined,
        parent_guardian_email: formData.parent_guardian_email || undefined,
        parent_guardian_phone: formData.parent_guardian_phone || undefined,
        student_email: formData.student_email || undefined,
        current_priorities: formData.current_priorities || undefined,
        scheduling_notes: formData.scheduling_notes || undefined,
        tutor_notes: formData.tutor_notes || undefined,
        tutoring_type: formData.tutoring_type
          ? formData.tutoring_type.split(',').map((s) => s.trim())
          : undefined,
        subjects: formData.subjects
          ? formData.subjects.split(',').map((s) => s.trim())
          : undefined,
        student_site_url: formData.student_site_url || undefined,
        github_repo_url: formData.github_repo_url || undefined,
        external_platform_notes: formData.external_platform_notes || undefined,
        start_date: formData.start_date
          ? new Date(formData.start_date)
          : undefined,
      });

      router.push(`/dashboard/students/${result.id}`);
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
          href="/dashboard/students"
          className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Students
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Add New Student
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                First Name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="preferred_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Preferred Name
            </label>
            <input
              id="preferred_name"
              name="preferred_name"
              type="text"
              value={formData.preferred_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="intake">Intake</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Start Date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Education
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="school_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                School Name
              </label>
              <input
                id="school_name"
                name="school_name"
                type="text"
                value={formData.school_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="grade_level"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Grade Level
              </label>
              <input
                id="grade_level"
                name="grade_level"
                type="text"
                value={formData.grade_level}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Parent/Guardian Information
          </h2>

          <div>
            <label
              htmlFor="parent_guardian_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name
            </label>
            <input
              id="parent_guardian_name"
              name="parent_guardian_name"
              type="text"
              value={formData.parent_guardian_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="parent_guardian_email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="parent_guardian_email"
                name="parent_guardian_email"
                type="email"
                value={formData.parent_guardian_email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="parent_guardian_phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Phone
              </label>
              <input
                id="parent_guardian_phone"
                name="parent_guardian_phone"
                type="tel"
                value={formData.parent_guardian_phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="student_email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Student Email
            </label>
            <input
              id="student_email"
              name="student_email"
              type="email"
              value={formData.student_email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tutoring & Subjects
          </h2>

          <div>
            <label
              htmlFor="tutoring_type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tutoring Types (comma-separated)
            </label>
            <input
              id="tutoring_type"
              name="tutoring_type"
              type="text"
              placeholder="e.g., Math, Science, Writing"
              value={formData.tutoring_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="subjects"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subjects (comma-separated)
            </label>
            <input
              id="subjects"
              name="subjects"
              type="text"
              placeholder="e.g., Algebra, US History"
              value={formData.subjects}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resources & Links
          </h2>

          <div>
            <label
              htmlFor="student_site_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Student Website/Portfolio
            </label>
            <input
              id="student_site_url"
              name="student_site_url"
              type="url"
              value={formData.student_site_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="github_repo_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              GitHub Repository
            </label>
            <input
              id="github_repo_url"
              name="github_repo_url"
              type="url"
              value={formData.github_repo_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notes
          </h2>

          <div>
            <label
              htmlFor="current_priorities"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Current Priorities
            </label>
            <textarea
              id="current_priorities"
              name="current_priorities"
              rows={3}
              value={formData.current_priorities}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="scheduling_notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Scheduling Notes
            </label>
            <textarea
              id="scheduling_notes"
              name="scheduling_notes"
              rows={3}
              value={formData.scheduling_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="tutor_notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tutor Notes
            </label>
            <textarea
              id="tutor_notes"
              name="tutor_notes"
              rows={3}
              value={formData.tutor_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="external_platform_notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              External Platform Notes
            </label>
            <textarea
              id="external_platform_notes"
              name="external_platform_notes"
              rows={3}
              value={formData.external_platform_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Student'}
          </button>
          <Link
            href="/dashboard/students"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
