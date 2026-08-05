export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to the Tutoring Command Center. This is a private operational
          system for managing tutoring clients and instructional work.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Students
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            0
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            No students yet
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Resources
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            0
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            No resources yet
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Sessions
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            0
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            No sessions yet
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Getting Started
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Phase 0 is complete. The foundation is ready for subsequent phases.
          See the documentation for implementation details and roadmap.
        </p>
      </div>
    </div>
  );
}
