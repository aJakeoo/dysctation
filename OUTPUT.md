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
