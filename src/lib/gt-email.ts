import { isAdminEmail } from "@/lib/constants";

/**
 * GT issues account usernames as first initial + last name + a number
 * (gburdell3, jsmith178). New name combinations start at 3; common ones climb
 * into the hundreds, hence 1-3 digits.
 */
const GT_USERNAME_LOCAL = /^[a-z][a-z'-]+[0-9]{1,3}$/;

/** Anything deliverable, for when aliases are allowed. */
const GENERIC_LOCAL = /^[a-z0-9](?:[a-z0-9._'+-]*[a-z0-9])?$/;

/** Alumni addresses are excluded on purpose: BK is for current students. */
export const GT_EMAIL_DOMAINS = [
  "gatech.edu",
  "mail.gatech.edu",
  "cc.gatech.edu",
  "ece.gatech.edu",
  "math.gatech.edu",
  "isye.gatech.edu",
] as const;

/**
 * GT's own alias guidance recommends firstname.lastname@gatech.edu, which is a
 * real mailbox that the username pattern rejects. Flip this to accept those
 * too — the verification email, not the pattern, is what proves the mailbox is
 * real. See docs/gt-email-auth-plan.md.
 */
export const ALLOW_GT_ALIASES = false;

export const GT_EMAIL_HINT =
  "Use your Georgia Tech email — first initial, last name, number (like gburdell3@gatech.edu).";

export const GT_EMAIL_REJECTION =
  "BK is only for Georgia Tech students, so we need a @gatech.edu address in the form gburdell3@gatech.edu.";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function splitEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

export function isGtDomain(domain: string) {
  return (GT_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

/** Does this address look like a Georgia Tech mailbox? Case-insensitive. */
export function isGtEmail(email: string) {
  const parts = splitEmail(normalizeEmail(email));
  if (!parts || !isGtDomain(parts.domain)) return false;
  return ALLOW_GT_ALIASES
    ? GENERIC_LOCAL.test(parts.local)
    : GT_USERNAME_LOCAL.test(parts.local);
}

/**
 * The operator's own account is exempt so a non-GT ADMIN_EMAIL can never be
 * locked out of the site it administers.
 */
export function isAllowedSignupEmail(email: string) {
  return isGtEmail(email) || isAdminEmail(email);
}
