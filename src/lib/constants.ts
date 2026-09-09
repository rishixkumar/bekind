export const SITE_NAME = "BK";

export const REPORT_REASONS = [
  "Unkind or harmful",
  "Harassment",
  "Spam",
  "Safety concern",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const TITLE_MAX = 120;
export const BODY_MAX = 5000;
export const REPLY_MAX = 2000;
export const DETAILS_MAX = 500;

export function isAdminEmail(email: string) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin) return false;
  return email.trim().toLowerCase() === admin;
}
