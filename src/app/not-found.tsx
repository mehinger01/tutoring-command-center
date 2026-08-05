import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
          404
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Page not found
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
