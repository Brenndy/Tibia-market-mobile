export function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (isNaN(diffMs) || diffMs < 0) return '';
  const hrs = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(hrs / 24);
  if (hrs < 1) return 'just now';
  if (hrs < 48) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
