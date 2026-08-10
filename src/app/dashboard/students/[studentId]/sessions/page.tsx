import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudentById } from '@/server/actions/students';
import { getSessions } from '@/server/actions/sessions';
import { getClientErrorMessage } from '@/lib/errors/app-error';

export default async function SessionsPage({
  params,
}: {
  params: { studentId: string };
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/auth/login');
  }

  let student;
  let sessions = [];
  let error: string | null = null;

  try {
    student = await getStudentById(params.studentId);
    sessions = await getSessions(params.studentId);
  } catch (err) {
    error = getClientErrorMessage(err);
  }

  if (!student) {
    return redirect('/dashboard/students');
  }

  const upcomingSessions = sessions.filter(
    (s) =>
      new Date(s.scheduled_start) > new Date() &&
      s.status !== 'cancelled' &&
      s.status !== 'no_show'
  );
  const pastSessions = sessions.filter(
    (s) =>
      new Date(s.scheduled_start) <= new Date() ||
      s.status === 'cancelled' ||
      s.status === 'no_show'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/students/${params.studentId}`}
            className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to {student.preferred_name || student.first_name}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Sessions
          </h1>
        </div>
        <Link
          href={`/dashboard/students/${params.studentId}/sessions/new`}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Schedule Session
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No upcoming sessions scheduled.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/students/${params.studentId}/sessions/${session.id}`}
                className="flex items-center justify-between rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
                    {new Date(session.scheduled_start).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {session.planned_focus && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {session.planned_focus}
                    </div>
                  )}
                </div>
                <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                  {session.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Past Sessions ({pastSessions.length})
          </h2>
          <div className="space-y-2">
            {pastSessions.slice(0, 10).map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/students/${params.studentId}/sessions/${session.id}`}
                className="flex items-center justify-between rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(
                      session.completed_at || session.scheduled_start
                    ).toLocaleDateString()}
                  </div>
                  {session.session_notes && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {session.session_notes}
                    </div>
                  )}
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    session.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }`}
                >
                  {session.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
