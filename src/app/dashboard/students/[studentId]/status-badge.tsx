export function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    active:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    intake: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    paused:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    archived:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[status] || statusColors.intake}`}
    >
      {status}
    </span>
  );
}
