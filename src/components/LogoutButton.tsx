'use client';

import { signOut } from '@/lib/auth/actions';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
    >
      Sign out
    </button>
  );
}
