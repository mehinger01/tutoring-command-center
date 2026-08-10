import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth/actions';
import { getStudents, getArchivedStudents } from '@/server/actions/students';
import { getClientErrorMessage } from '@/lib/errors/app-error';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const view = params.view || 'active';

  let students = [];
  let archivedStudents = [];
  let error: string | null = null;

  try {
    students = await getStudents();
    archivedStudents = await getArchivedStudents();
  } catch (err) {
    error = getClientErrorMessage(err);
  }

  const displayStudents = view === 'archived' ? archivedStudents : students;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Students
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your tutoring students
          </p>
        </div>
        {view !== 'archived' && (
          <Link
            href="/dashboard/students/new"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            New Student
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/dashboard/students?view=active"
          className={`px-4 py-2 font-medium transition-colors ${
            view !== 'archived'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Active ({students.length})
        </Link>
        <Link
          href="/dashboard/students?view=archived"
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'archived'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Archived ({archivedStudents.length})
        </Link>
      </div>

      {displayStudents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-gray-600 dark:text-gray-400">
            {view === 'archived'
              ? 'No archived students. Active students can be archived from their detail page.'
              : 'No students yet. Create your first student to get started.'}
          </p>
          {view !== 'archived' && (
            <Link
              href="/dashboard/students/new"
              className="mt-4 inline-block text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create a student →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayStudents.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {student.preferred_name || student.first_name}{' '}
                    {student.last_name}
                  </h3>
                  {student.school_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {student.school_name}
                      {student.grade_level && ` • Grade ${student.grade_level}`}
                    </p>
                  )}
                  {student.tutoring_type &&
                    student.tutoring_type.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {student.tutoring_type.map((type: string) => (
                          <span
                            key={type}
                            className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                      student.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : student.status === 'intake'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          : student.status === 'archived'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
