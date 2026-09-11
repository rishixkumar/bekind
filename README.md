# Be Kind

A public, student-native peer-support board. Anyone can read. Georgia Tech students (GT-format email) post, reply, upvote, and report. Authors can post as **named** or **anonymous** (admins still see who wrote it).

Live: [https://be-kind-green.vercel.app](https://be-kind-green.vercel.app)

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `DATABASE_URL`, `AUTH_SECRET`, and `ADMIN_EMAIL`, then:

```bash
npm run db:push
npm run dev
```

`npm run db:push` applies Drizzle schema to the shared Neon database. Additive nullable columns (e.g. `users.signup_ip`, `users.signup_location`) are safe: existing rows stay null and older deploys that ignore the columns keep working. Do not use push to drop or rename columns on this DB.

The account that signs up with `ADMIN_EMAIL` can open `/admin` (users, logins, reports, hide/restore, bans). Signup IP and approximate geo (from Vercel headers) are stored for duplicate/logging checks and shown only on `/admin`.

`RESEND_API_KEY` is optional and unused for signup right now (kept for a future mailer).

## Georgia Tech accounts

Signup requires a GT address in GT's account-username form (`gburdell3@gatech.edu`). Pattern match is enough for now — no emailed verification code. Reading never requires an account.

This is deliberately **not** GT SSO. Duo is a second factor, not an identity provider, and GT's real SSO (CAS at `login.gatech.edu`, Shibboleth SAML at `idp.gatech.edu`) is only open to Service Providers registered through OIT. See [`docs/gt-email-auth-plan.md`](docs/gt-email-auth-plan.md) for the full reasoning, the alias trade-off, and what a real SSO integration would take.

This is not a crisis service. The site footer links to [988](https://988lifeline.org/).

## Architecture

One Next.js App Router app (not a separate Express API). Pages, Server Actions, and Auth.js all live in the same process.

**Frontend**

- App Router pages in `src/app`
- React client components for forms, the anonymous toggle, report dialog, upvote button, and admin dashboard
- shadcn/ui + Tailwind
- Student-native copy and layout (Nunito, compact “room” feed)

**Backend**

- Server Components load data on the server (`src/lib/queries.ts`, `src/lib/session.ts`)
- Server Actions in `src/lib/actions/*` handle writes
- Auth.js (NextAuth v5) in `src/auth.ts`, routed at `/api/auth/[...nextauth]`
- Drizzle ORM + Neon Postgres (`src/db`)
- Admin is whoever matches `ADMIN_EMAIL` (role is also stored as `admin` on that user)

**Routes**

| Path | Who | What |
| --- | --- | --- |
| `/` | anyone | Newest-first feed |
| `/posts/[id]` | anyone | Thread + replies |
| `/posts/new` | signed-in, not banned | Compose |
| `/login`, `/signup` | guests | Credentials auth |
| `/verify` | anyone | Redirects home (legacy) |
| `/admin` | admin only (everyone else gets 404) | Users, reports, hide/restore, bans |

**Tables** (`src/db/schema.ts`)

- `users` — email, username, password hash, role, `lastLoginAt`, `bannedAt`, `emailVerifiedAt`, `signupIp`, `signupLocation`
- `email_verification_tokens` — legacy; unused by the app path today
- `posts` — title, body, `isAnonymous`, `hiddenAt` / `hiddenBy`
- `replies` — nested via `parentId`, same anonymous + hide fields
- `votes` — one row per user+post or user+reply
- `reports` — target type/id, reason, open/resolved

## Data flow

Guests never hit an auth check on the feed. Writes always go through a Server Action that requires a session and rejects banned accounts.

```mermaid
flowchart TD
  Neon[(Neon Postgres)]

  subgraph guestRead [Guest feed]
    Guest[Guest browser]
    HomePage["/ Server Component"]
    GetFeed[getFeedPosts]
    Guest --> HomePage --> GetFeed
  end

  GetFeed --> Neon
  Neon --> GetFeed
  GetFeed --> HomePage
  HomePage --> Guest

  subgraph writePath [Signed-in write]
    Form[Client form]
    Action[Server Action]
    Session[requireActiveUser]
    Drizzle[Drizzle insert or update]
    Revalidate[revalidatePath]
    Form --> Action --> Session --> Drizzle
  end

  Drizzle --> Neon
  Drizzle --> Revalidate
```

Auth, anonymity, votes, and moderation:

```mermaid
flowchart TD
  Users[(users)]
  Posts[(posts / replies)]
  Votes[(votes)]
  Reports[(reports)]

  subgraph authFlow [Auth]
    Signup[signUpAction]
    Hash[bcrypt hash]
    Login[loginAction]
    AuthJS["Auth.js credentials"]
    JWT[JWT session]
    Signup --> Hash --> Users
    Login --> AuthJS --> Users
    AuthJS --> JWT
  end

  subgraph anonFlow [Anonymous]
    Flag["isAnonymous stored on row"]
    PublicUI["Public UI: Anonymous"]
    AdminUI["Admin / author: real username"]
    Flag --> PublicUI
    Flag --> AdminUI
  end

  subgraph voteFlow [Upvotes]
    Toggle[toggle vote action]
    Toggle -->|"row exists: delete"| Votes
    Toggle -->|"no row: insert"| Votes
  end

  subgraph modFlow [Reports and admin]
    ReportAction[reportContentAction]
    Hide["hide: set hiddenAt"]
    Ban["ban: set bannedAt"]
    ReportAction --> Reports
    Hide --> Posts
    Ban --> Users
  end
```

**Read:** `/` is a Server Component. It optionally loads the session (`getAppUser`) so upvote state can be personalized, then `getFeedPosts` queries Neon and renders. Hidden posts (`hiddenAt` set) are omitted. No login required.

**Write:** Client form → Server Action → `requireActiveUser` (must be logged in and not banned) → Zod parse → Drizzle insert/update → `revalidatePath`. Banned users can still read; posting is paused.

**Auth:** Signup validates the GT address pattern, hashes the password with bcrypt, inserts into `users` with `emailVerifiedAt` set (admin role if the email is `ADMIN_EMAIL`), records `signupIp` / `signupLocation` from request headers when available, then signs in and lands on `/`. Login goes through Auth.js credentials, compares the hash, updates `lastLoginAt`, and issues a JWT session.

**Anonymous:** `isAnonymous` is a flag on the post/reply row. Author id is always stored. Public pages render “Anonymous”; the author sees “Anonymous · you”; admin pages and `displayName(..., isAdmin)` show the real username.

**Report / hide / ban:** A report inserts into `reports`. Admin hide/restore is a soft hide (`hiddenAt` / `hiddenBy`). Ban sets `bannedAt`. Admin can also hard-delete a post.

**Upvotes:** Toggle inserts or deletes the unique vote row, then revalidates the feed and thread.
