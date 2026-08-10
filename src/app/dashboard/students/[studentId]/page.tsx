import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudentById, archiveStudent, unarchiveStudent } from '@/server/actions/students';
import { getIntakes } from '@/server/actions/intakes';
import { getSessions } from '@/server/actions/sessions';
import { getClientErrorMessage } from '@/lib/errors/app-error';
import { ArchiveButton } from './archive-button';
import { StatusBadge } from './status-badge';

export default async function StudentDetailPage({
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
  let sessions = [];
  let error: string | null = null;

  try {
    student = await getStudentById(params.studentId);
    intakes = await getIntakes(params.studentId);
    sessions = await getSessions(params.studentId);
  } catch (err) {
    error = getClientErrorMessage(err);
  }

  if (!student) {
    return redirect('/dashboard/students');
  }

  const latestIntake = intakes.length > 0 ? intakes[0] : null;
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.scheduled_start) > new Date() && s.status !== 'cancelled' && s.status !== 'no_show'
  );
  const completedSessions = sessions.filter((s) => s.status === 'completed').reverse();

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {student.preferred_name || student.first_name} {student.last_name}
            </h1>
            <StatusBadge status={student.status} />
          </div>
          <Link
            href="/dashboard/students"
            className="mt-2 text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Students
          </Link>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/students/${params.studentId}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Edit
          </Link>
          <ArchiveButton studentId={params.studentId} isArchived={student.status === 'archived'} />
        </div>
      </div>

      {/* Overview Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>
          <div className="space-y-3 text-sm">
            {student.school_name && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">School:</span>{' '}
                {student.school_name}
              </div>
            )}
            {student.grade_level && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Grade:</span>{' '}
                {student.grade_level}
              </div>
            )}
            {student.tutoring_type && student.tutoring_type.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Tutoring Type:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {student.tutoring_type.map((type) => (
                    <span
                      key={type}
                      className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {student.subjects && student.subjects.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Subjects:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {student.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {student.start_date && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Start Date:</span>{' '}
                {new Date(student.start_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
          <div className="space-y-3 text-sm">
            {student.parent_guardian_name && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Guardian:</span>{' '}
                {student.parent_guardian_name}
              </div>
            )}
            {student.parent_guardian_email && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Guardian Email:</span>{' '}
                <a
                  href={`mailto:${student.parent_guardian_email}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {student.parent_guardian_email}
                </a>
              </div>
            )}
            {student.parent_guardian_phone && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Guardian Phone:</span>{' '}
                <a
                  href={`tel:${student.parent_guardian_phone}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {student.parent_guardian_phone}
                </a>
              </div>
            )}
            {student.student_email && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Student Email:</span>{' '}
                <a
                  href={`mailto:${student.student_email}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {student.student_email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Links Section */}
      {(student.student_site_url || student.github_repo_url) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Resources</h2>
          <div className="flex flex-wrap gap-4">
            {student.student_site_url && (
              <a
                href={student.student_site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
              >
                Student Site →
              </a>
            )}
            {student.github_repo_url && (
              <a
                href={student.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                GitHub Repository →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Latest Intake */}
      {latestIntake && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Intake</h2>
            <Link
              href={`/dashboard/students/${params.studentId}/intake`}
              className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all intakes →
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {latestIntake.initial_goals && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Goals:</span> {latestIntake.initial_goals}
              </div>
            )}
            {latestIntake.parent_concerns && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Parent Concerns:</span>{' '}
                {latestIntake.parent_concerns}
              </div>
            )}
            {latestIntake.accommodations && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Accommodations:</span>{' '}
                {latestIntake.accommodations}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Sessions ({upcomingSessions.length})
          </h2>
          <Link
            href={`/dashboard/students/${params.studentId}/sessions/new`}
            className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Schedule session →
          </Link>
        </div>
        {upcomingSessions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No upcoming sessions scheduled.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {upcomingSessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/students/${params.studentId}/sessions/${session.id}`}
                className="block rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
                  {new Date(session.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {session.planned_focus && (
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{session.planned_focus}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      {completedSessions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Sessions ({completedSessions.length})
          </h2>
          <div className="space-y-2">
            {completedSessions.slice(0, 5).map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/students/${params.studentId}/sessions/${session.id}`}
                className="block rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date(session.completed_at || session.scheduled_start).toLocaleDateString()}
                </div>
                {session.session_notes && (
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{session.session_notes}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
