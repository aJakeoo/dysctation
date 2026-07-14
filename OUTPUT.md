# Supabase migration: FA status on voice recordings

Run this in the Supabase SQL editor to add the `has_fa` column used by the
`/contribute` upload flow:

```sql
alter table voice_recordings
add column if not exists has_fa boolean null;
```

The contribute page now requires contributors to answer "Do you have
Friedreich's Ataxia?" before proceeding, and includes the answer as
`has_fa: true/false` in every `voice_recordings` insert.

# Security hardening: lock down Supabase anon permissions

A security review found the anon role has SELECT, UPDATE, DELETE, TRUNCATE,
REFERENCES, and TRIGGER grants on `voice_recordings`, when the app only ever
needs to INSERT from the client. Run this in the Supabase SQL editor to
restrict it:

```sql
-- Restrict anon to insert-only on the recordings table
revoke select, update, delete, truncate, references, trigger on voice_recordings from anon;
grant insert on voice_recordings to anon;

-- Verify storage: anon should have INSERT only on the voice-recordings bucket.
-- If any SELECT policy exists for anon on storage.objects for this bucket, drop it:
-- drop policy if exists "<policy name>" on storage.objects;
```

Confirmed the app code never performs a SELECT, UPDATE, or DELETE against
`voice_recordings` or the `voice-recordings` bucket from the client (grepped
for `.select(`, `.update(`, `.delete(`, `.upsert(` across `app/` and found
none) -- `app/contribute/page.tsx` only ever calls `.insert()` and
`storage.from("voice-recordings").upload()`. No app code changes were needed
for this part.

# Security hardening: rate limiting and privacy page

- `app/api/transcribe/route.ts` now rate limits to 30 requests per minute
  per IP (read from `x-forwarded-for`, which Vercel sets), using an
  in-memory `Map<string, number[]>` of request timestamps pruned on every
  request. Returns HTTP 429 with `{ "error": "Too many requests. Please
  slow down." }` once exceeded. This state is per-instance and resets on
  cold starts (noted in a code comment) -- acceptable at this app's scale,
  and avoids pulling in Redis or another external store for one low-traffic
  route. Verified locally: 30 rapid requests from the same simulated IP
  succeeded (400, since no audio was attached), the 31st and 32nd both
  returned 429 with the exact error body above.
- `app/contribute/page.tsx` now enforces a minimum 2 second cooldown
  between submissions: `handleSubmit` sets a `submitCooldown` flag the
  moment it's called and clears it after 2 seconds via `setTimeout`,
  independent of how long the actual upload takes. The Submit button is
  disabled and dimmed (`disabled:opacity-50`) while the cooldown is active.
- Added `app/privacy/page.tsx`, a static privacy policy page matching the
  existing design system (`bg-wireframe`, same typography/color tokens),
  covering both the dictation page's and `/contribute`'s data handling.
  Added a small "Privacy" link to both footers (`app/components/Footer.tsx`
  and `/contribute`'s `ContributeFooter`).
- Verified `npx tsc --noEmit` and `next build` both succeed (including the
  new `/privacy` static route). No em dashes in any new text (checked via
  `grep`).
