'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          An unexpected error occurred while processing your request.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="mt-6 overflow-auto rounded-lg bg-gray-900 p-4 text-left text-sm text-gray-100">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
