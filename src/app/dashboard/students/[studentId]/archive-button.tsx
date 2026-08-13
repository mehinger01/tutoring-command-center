'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveStudent, unarchiveStudent } from '@/server/actions/students';
import { getClientErrorMessage } from '@/lib/errors/app-error';

export function ArchiveButton({
  studentId,
  isArchived,
}: {
  studentId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (
      !confirm(
        `Are you sure you want to ${isArchived ? 'unarchive' : 'archive'} this student?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isArchived) {
        await unarchiveStudent(studentId);
      } else {
        await archiveStudent(studentId);
      }
      router.refresh();
    } catch (err) {
      alert(getClientErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSubmitting}
      className={`rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 ${
        isArchived
          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50'
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-200 dark:hover:bg-gray-900/50'
      }`}
    >
      {isSubmitting ? 'Updating...' : isArchived ? 'Unarchive' : 'Archive'}
    </button>
  );
}
