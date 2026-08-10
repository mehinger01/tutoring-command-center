import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudentById } from '@/server/actions/students';
import { getIntakes } from '@/server/actions/intakes';
import { getClientErrorMessage } from '@/lib/errors/app-error';
import { IntakeForm } from './intake-form';

export default async function IntakePage({
  params,
}: {
  params: { studentId: string };
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/auth/login');
  }

  let student;
  let intakes = [];
  let error: string | null = null;

  try {
    student = await getStudentById(params.studentId);
    intakes = await getIntakes(params.studentId);
  } catch (err) {
    error = getClientErrorMessage(err);
  }

  if (!student) {
    return redirect('/dashboard/students');
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href={`/dashboard/students/${params.studentId}`}
          className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to {student.preferred_name || student.first_name}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Intake Forms</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage intake information for {student.preferred_name || student.first_name}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <IntakeForm studentId={params.studentId} />

      {intakes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Intake History</h2>
          <div className="grid gap-4">
            {intakes.map((intake) => (
              <div
                key={intake.id}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {new Date(intake.created_at).toLocaleDateString()} at{' '}
                    {new Date(intake.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </h3>
                  <Link
                    href={`/dashboard/students/${params.studentId}/intake/${intake.id}`}
                    className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View/Edit →
                  </Link>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {intake.initial_goals && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Goals:</span>{' '}
                      {intake.initial_goals}
                    </div>
                  )}
                  {intake.parent_concerns && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Parent Concerns:</span>{' '}
                      {intake.parent_concerns}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
