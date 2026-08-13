'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createIntake } from '@/server/actions/intakes';
import { getClientErrorMessage } from '@/lib/errors/app-error';

export function IntakeForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    referral_source: '',
    parent_concerns: '',
    student_concerns: '',
    academic_needs: '',
    executive_function_needs: '',
    student_interests: '',
    accommodations: '',
    initial_goals: '',
    assessment_plan: '',
    package_notes: '',
    scheduling_expectations: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      await createIntake(studentId, {
        referral_source: formData.referral_source || undefined,
        parent_concerns: formData.parent_concerns || undefined,
        student_concerns: formData.student_concerns || undefined,
        academic_needs: formData.academic_needs || undefined,
        executive_function_needs:
          formData.executive_function_needs || undefined,
        student_interests: formData.student_interests || undefined,
        accommodations: formData.accommodations || undefined,
        initial_goals: formData.initial_goals || undefined,
        assessment_plan: formData.assessment_plan || undefined,
        package_notes: formData.package_notes || undefined,
        scheduling_expectations: formData.scheduling_expectations || undefined,
      });

      setSuccess(true);
      setFormData({
        referral_source: '',
        parent_concerns: '',
        student_concerns: '',
        academic_needs: '',
        executive_function_needs: '',
        student_interests: '',
        accommodations: '',
        initial_goals: '',
        assessment_plan: '',
        package_notes: '',
        scheduling_expectations: '',
      });
      router.refresh();
    } catch (err) {
      setError(getClientErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        New Intake Form
      </h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          Intake form created successfully!
        </div>
      )}

      <div>
        <label
          htmlFor="referral_source"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Referral Source
        </label>
        <textarea
          id="referral_source"
          name="referral_source"
          rows={2}
          value={formData.referral_source}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="How did the family hear about you?"
        />
      </div>

      <div>
        <label
          htmlFor="parent_concerns"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Parent Concerns
        </label>
        <textarea
          id="parent_concerns"
          name="parent_concerns"
          rows={3}
          value={formData.parent_concerns}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="What are the parent's main concerns?"
        />
      </div>

      <div>
        <label
          htmlFor="student_concerns"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Student Concerns
        </label>
        <textarea
          id="student_concerns"
          name="student_concerns"
          rows={3}
          value={formData.student_concerns}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="What are the student's expressed concerns or goals?"
        />
      </div>

      <div>
        <label
          htmlFor="academic_needs"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Academic Needs
        </label>
        <textarea
          id="academic_needs"
          name="academic_needs"
          rows={3}
          value={formData.academic_needs}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="What specific academic support is needed?"
        />
      </div>

      <div>
        <label
          htmlFor="executive_function_needs"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Executive Function Needs
        </label>
        <textarea
          id="executive_function_needs"
          name="executive_function_needs"
          rows={3}
          value={formData.executive_function_needs}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Organization, planning, time management needs?"
        />
      </div>

      <div>
        <label
          htmlFor="student_interests"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Student Interests
        </label>
        <textarea
          id="student_interests"
          name="student_interests"
          rows={2}
          value={formData.student_interests}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="What interests the student?"
        />
      </div>

      <div>
        <label
          htmlFor="accommodations"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Accommodations
        </label>
        <textarea
          id="accommodations"
          name="accommodations"
          rows={3}
          value={formData.accommodations}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="IEP, 504 plan, or other accommodations"
        />
      </div>

      <div>
        <label
          htmlFor="initial_goals"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Initial Goals *
        </label>
        <textarea
          id="initial_goals"
          name="initial_goals"
          rows={3}
          value={formData.initial_goals}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="What are the initial goals for tutoring?"
        />
      </div>

      <div>
        <label
          htmlFor="assessment_plan"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Assessment Plan
        </label>
        <textarea
          id="assessment_plan"
          name="assessment_plan"
          rows={2}
          value={formData.assessment_plan}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="How will progress be assessed?"
        />
      </div>

      <div>
        <label
          htmlFor="package_notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Package Notes
        </label>
        <textarea
          id="package_notes"
          name="package_notes"
          rows={2}
          value={formData.package_notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Tutoring package details and duration"
        />
      </div>

      <div>
        <label
          htmlFor="scheduling_expectations"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Scheduling Expectations
        </label>
        <textarea
          id="scheduling_expectations"
          name="scheduling_expectations"
          rows={2}
          value={formData.scheduling_expectations}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Preferred frequency, time of day, location"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Create Intake'}
      </button>
    </form>
  );
}
