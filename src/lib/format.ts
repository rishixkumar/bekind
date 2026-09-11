export function formatTimeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Exact local timestamp for admin logging (not relative). */
export function formatExactDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function previewText(body: string, max = 160) {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function displayName(opts: {
  username: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
  isAuthor?: boolean;
}) {
  if (opts.isAdmin) {
    return opts.isAnonymous ? `${opts.username} (anon)` : opts.username;
  }
  if (opts.isAnonymous) {
    return opts.isAuthor ? "Anonymous · you" : "Anonymous";
  }
  return opts.username;
}

export function wasEdited(createdAt: Date, updatedAt: Date) {
  return updatedAt.getTime() - createdAt.getTime() > 1000;
}
