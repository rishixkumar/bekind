# Be Kind

A public, student-native peer-support board. Anyone can read. Signed-in users post, reply, upvote, and report. Authors can post as **named** or **anonymous** (admins still see who wrote it).

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

The account that signs up with `ADMIN_EMAIL` can open `/admin` (users, logins, reports, hide/restore, bans).

This is not a crisis service. The site footer links to [988](https://988lifeline.org/).
