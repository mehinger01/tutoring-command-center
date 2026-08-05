import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Authentication Error
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Something went wrong during authentication
        </p>
      </div>

      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
        <p>
          Please try signing in again. If the problem persists, contact support.
        </p>
      </div>

      <div className="space-y-2 text-center">
        <Link
          href="/auth/login"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Back to Sign In
        </Link>
      </div>

      <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          This is a private application for authorized users only.
        </p>
      </div>
    </div>
  );
}
