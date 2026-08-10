import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth/actions';

export default async function Home() {
  // If user is authenticated, redirect to dashboard
  const user = await getAuthUser();
  if (user) {
    redirect('/dashboard');
  }

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
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-block rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-block rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-900"
            >
              Create Account
            </Link>
          </div>
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
