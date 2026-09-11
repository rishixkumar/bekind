-- Grandfather every account that existed before GT email verification shipped.
--
-- Run this ONCE, right after `npm run db:push` adds users.email_verified_at and
-- before the feature/gt-email-auth branch is merged. Without it, the write gate
-- treats every pre-existing user as unverified and quietly stops them posting.
--
-- New signups are unaffected: they are inserted after this runs, with a NULL
-- email_verified_at, and confirm their mailbox the normal way.
--
--   psql "$DATABASE_URL" -f scripts/backfill-email-verification.sql
--
-- (Or paste it into the Neon SQL editor / `npm run db:studio`.)

UPDATE users
SET email_verified_at = now()
WHERE email_verified_at IS NULL;

-- Sanity check: should return 0.
SELECT count(*) AS still_unverified FROM users WHERE email_verified_at IS NULL;
