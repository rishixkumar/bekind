# Restricting BK to Georgia Tech students

Goal: only people with a real Georgia Tech mailbox can post on BK. Reading stays
open to everyone.

## 1. Reality check on "log in with Duo"

The original idea was to hand authentication to GT's Duo. That is not possible,
and it is worth being precise about why, because the reason changes the design.

**Duo is a second factor, not an identity provider.** Duo verifies that a person
who *already* authenticated somewhere still holds an enrolled device. It has no
concept of "a Georgia Tech student" that an outside site can query. Cisco does
sell Duo SSO / Duo Directory, which can act as an IdP, but it authenticates
users *in that Duo tenant* — GT's tenant, which only GT administers. There is no
public "sign in with Duo" the way there is "sign in with Google."

**GT's real SSO is CAS and Shibboleth SAML, and both are gated.**

- `login.gatech.edu/cas` is GT's CAS server (CAS 1.0/2.0 validate endpoints).
- `idp.gatech.edu/idp/shibboleth` is GT's SAML 2.0 Shibboleth IdP, registered in
  the InCommon federation.

Either one can authenticate GT users, but only for a **registered Service
Provider**. Registration goes through OIT (`support@oit.gatech.edu`): you submit
the application, exchange SAML metadata or register the CAS service URL, and get
approval from data stewards. GT's own CAS documentation also warns that
authentication alone is not authorization — GT issues accounts to far more
people than a given app should admit, so an SP is expected to do its own
authorization check afterward.

A student side project on a `vercel.app` domain is not going to be approved as
an institutional SP, and there is no self-serve path. So SSO is off the table
for this MVP.

**What actually achieves the goal.** The requirement is "prove this person is at
Georgia Tech." Control of a `@gatech.edu` mailbox proves exactly that, because
GT is the one who issues those mailboxes and deprovisions them at offboarding.
So:

1. Validate the email is a GT address, by pattern.
2. Send a code to that address and require it before the account can write.

Step 2 is the part that matters. Pattern matching alone is trivially forged —
anyone can type `gburdell3@gatech.edu` into a form. The round-trip through the
mailbox is what makes it real. This is the same mechanism most .edu-gated
products use.

**Upgrade path, if BK ever wants true GT SSO.** It would need: a stable
institutional domain, a security/privacy review, a sponsoring GT department,
an SP registration request to OIT, SAML metadata exchange with
`idp.gatech.edu` (or CAS service registration), and probably a GTED data access
request approved by data stewards if BK wanted directory attributes like
enrollment status. At that point Duo comes along for free — it fires during the
GT login step, not as something BK integrates with. Nothing in this MVP blocks
that later: the `emailVerifiedAt` column stays meaningful, and a SAML login
would just be another way to set it.

## 2. The email pattern

GT account usernames are first initial + last name + a number: `gburdell3`,
`jsmith178`. New unique combinations start at 3, and common ones climb into the
hundreds, so 1–3 digits is the right allowance. Hyphens and apostrophes appear
in real last names.

```
^[a-z][a-z'-]+[0-9]{1,3}$   (local part, lowercased)
```

**Domains.** Accept `gatech.edu` plus the department subdomains that have
historically issued real mail: `cc.gatech.edu`, `mail.gatech.edu`,
`ece.gatech.edu`, `math.gatech.edu`, `gatech.edu`'s `alum` is deliberately
excluded — alumni are not current students. The list lives in one constant so it
is easy to adjust.

**Known trade-off: aliases.** GT lets anyone set an email alias through Passport,
and GT's own published guidance *recommends* `firstname.lastname@gatech.edu`.
Those addresses are real, deliverable GT mailboxes but they do **not** match the
username pattern. Enforcing the strict pattern therefore rejects some legitimate
students at the signup form.

We ship strict-by-default because that is the stated requirement, but the
relaxation is a one-line flip: `ALLOW_GT_ALIASES` in `src/lib/gt-email.ts`. When
true, any well-formed local part on an allowed GT domain is accepted. Since
verification email is the real gate, turning it on does not weaken the check —
it only stops rejecting people who then can't sign up at all. Recommend
revisiting after the first real users hit the form.

## 3. Checklist

- [x] `src/lib/gt-email.ts` — domain allowlist, username regex, alias escape
      hatch, normalization to lowercase, human-readable rejection message
- [x] Zod: `signUpSchema.email` runs the GT check; admin (`ADMIN_EMAIL`) is
      exempt so the operator can never be locked out of their own site
- [x] Schema (additive only, so `main` keeps working against the same DB):
      `users.emailVerifiedAt` (nullable timestamp) and a
      `email_verification_tokens` table
- [x] Codes: 6 digits, stored as a SHA-256 hash, 15-minute expiry, single use,
      max 5 wrong guesses, previous codes invalidated on resend
- [x] Delivery: Resend via REST (`RESEND_API_KEY`, no new dependency). Without a
      key there is no provider to fail, so the code goes to the server console
      instead — that keeps signup completable on a preview deploy, where
      `NODE_ENV` is "production" but no key is configured
- [x] Resend rate limit: 60s cooldown, 5 per hour per account
- [x] Write gating in `requireActiveUser()` — posts, replies, votes, reports.
      Reading, login, and signup stay open. Admins bypass
- [x] Existing accounts: backfilled to verified by
      `scripts/backfill-email-verification.ts` so nobody is retroactively locked
      out. Run once, before/with the merge
- [x] UI: signup hint + errors, `/verify` code page, an unverified banner on the
      feed, GT navy/gold styling, BK voice
- [x] `npm run db:push`, typecheck, build

## 4. Migration safety

The dev and production databases are the same Neon instance, so every change had
to be safe for the currently-deployed `main`:

- `users.email_verified_at` is nullable with no default — old code never selects
  it and inserts still succeed without it.
- `email_verification_tokens` is a brand-new table; nothing on `main` reads it.
- Nothing is dropped or renamed.

Backfilling existing users to verified is what keeps the gate from turning into
a lockout the moment this branch merges.
