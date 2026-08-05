import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Tutoring Command Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Private operational system for managing tutoring clients and
            instructional work
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            href="/auth/login"
            className="inline-block w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            Sign In
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Private application. Sign in with your authorized account.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Tutoring Command Center. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
