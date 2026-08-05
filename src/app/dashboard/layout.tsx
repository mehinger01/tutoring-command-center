import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-gray-900 dark:text-white"
          >
            Tutoring Command Center
          </Link>
          <nav className="flex items-center gap-6">
            <a
              href="/api/auth/logout"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Sign out
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Tutoring Command Center. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
