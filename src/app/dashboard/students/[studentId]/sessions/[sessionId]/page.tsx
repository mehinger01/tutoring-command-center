import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudentById } from '@/server/actions/students';
import { getSessionById, completeSession } from '@/server/actions/sessions';
import { getClientErrorMessage } from '@/lib/errors/app-error';
import { SessionDetailContent } from './session-detail-content';

export default async function SessionDetailPage({
  params,
}: {
  params: { studentId: string; sessionId: string };
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/auth/login');
  }

  let student;
  let session;
  let error: string | null = null;

  try {
    student = await getStudentById(params.studentId);
    session = await getSessionById(params.sessionId);
  } catch (err) {
    error = getClientErrorMessage(err);
  }

  if (!student || !session) {
    return redirect(`/dashboard/students/${params.studentId}/sessions`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/students/${params.studentId}/sessions`}
          className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Sessions
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Session: {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
          {new Date(session.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <SessionDetailContent
        studentId={params.studentId}
        session={session}
      />
    </div>
  );
}
