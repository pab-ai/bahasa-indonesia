# Lancar

Mobile-first adaptive Indonesian practice grounded in Pablo's Cinta Bahasa material. The MVP runs immediately in local demo mode and persists quiz progress in `localStorage`; connecting Supabase replaces that persistence layer without changing the learning engine.

## What the source analysis found

The 23 handwritten pages and 19 photographed workbook pages cover early A1 practical Indonesian: greetings by time, farewells, classroom requests, introductions and titles, personal pronouns (especially `kami`/`kita`), origin/location/movement with `dari`/`di`/`ke`, question forms, `mau`, `suka`, `untuk`, `siap`, `ayo`, food/drink, daily routines, and short dialogues. Workbook exercise patterns include listening transcription, situational greetings, dialogue gap-fill, true/false comprehension, and word-bank completion.

Handwritten answers are not treated as authoritative. Ambiguous items—including some greeting-time answers, translations, spelling, `tadi malam` versus `kemarin malam`, and workbook gap fills—remain annotations or review candidates. The app's approved seed content uses clear printed examples or high-confidence lesson notes.

## Architecture

- Next.js App Router + TypeScript + Tailwind; mobile quiz state is preloaded and mirrored locally for interruption resilience.
- Pure functions in `lib/learning.ts` handle grading, mastery, spacing, scoring, adaptive selection, and deduplication.
- Supabase separates source documents/pages, candidate curriculum, approved concepts/examples, reusable questions, and immutable attempt history. Row-level security scopes personal data by authenticated user.
- The intended ingestion service stores uploads privately, submits page images through a server-only AI-provider adapter, validates structured JSON, creates reviewable candidates, and only merges approved candidates by canonical key. Secrets never reach the browser.
- Vercel hosts Next.js; Supabase provides Auth, Postgres, and private Storage.

## Run

```bash
npm install
npm run dev
npm test
npm run build
```

Copy `.env.example` to `.env.local` and fill in your Supabase project values. Apply `supabase/migrations/001_initial.sql` with the Supabase CLI or SQL editor. Add the same public Supabase values and server-side AI key to Vercel. Never prefix secret keys with `NEXT_PUBLIC_`.

## Deployment

Push the repository to GitHub, import it in Vercel, set the environment variables, and deploy. The application is Vercel-compatible; no filesystem writes are required at runtime. Configure a private Supabase Storage bucket named `learning-materials` before enabling live uploads.
