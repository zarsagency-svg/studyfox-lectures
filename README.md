# STUDY FOX — Next.js lecture portal

A Next.js 16 (App Router) + TypeScript + Tailwind v4 clone of the PW/StudyFox batch
browsing experience: batches, subjects, chapters, lectures, DPP PDFs, DPP videos,
quizzes and test series, proxied from the public `pw.studyfox.eu.cc` API.

## Video playback (important)

PW serves lectures as **CENC/ClearKey protected DASH** behind **signed CloudFront
URLs**. The raw `videoDetails.videoUrl` returned by `/api/lecture-details` is
unsigned and always answers `403 MissingKey`, so it can never be played directly.

Playback therefore works in three steps:

1. `src/lib/playback.ts` → `resolvePlayback()` asks `/api/pw/api/video` for a
   signed manifest (`Signature` / `Policy` / `Key-Pair-Id`) **and** the ClearKey
   `clearKeys` for that lecture.
2. `src/app/api/stream/route.ts` re-writes the manifest so every relative segment
   / `BaseURL` / HLS `URI=` keeps the signature query string (players drop it,
   which is the second cause of 403s).
3. `src/components/VideoPlayer.tsx` hands the keys to dash.js via
   `setProtectionData({ "org.w3.clearkey": { clearkeys } })` before `initialize()`
   and converts the hex key ids to base64url (what the CDN licence request uses).

Video bytes are **not** proxied: the CDN answers with
`Access-Control-Allow-Origin: <your origin>` and supports Range requests, so the
player streams straight from the edge.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional, see below
npm run dev
```

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | no | Postgres for OTP login, enrollments, progress + history sync. Without it the app runs in **Guest mode**: browsing and video playback work, login is disabled with a clear message. |

To enable login, run [`sql/init.sql`](sql/init.sql) in your database and set
`DATABASE_URL` (Supabase → Project Settings → Database → Connection string →
URI; use the **Session pooler** host and URL-encode special characters).

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build (works without DATABASE_URL)
npm run start      # serve the production build
npm run lint
npm run typecheck
```

## Notes

- Signed video URLs expire within hours; they are minted per lecture open and
  never cached (`no-store`).
- Lectures with `videoDetails.drmProtected === true` use Widevine and cannot be
  played with ClearKey keys.
