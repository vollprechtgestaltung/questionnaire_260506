-- Puls Questionnaire — Supabase Setup
-- Run this in the Supabase SQL Editor

-- 1. Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option     smallint NOT NULL CHECK (option BETWEEN 1 AND 4),
  device_id  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Time the vote was cast on the device, as opposed to created_at (arrival in
  -- the DB). The two differ for votes that sat in the offline queue. Added
  -- after initial rollout, hence nullable: queue entries written before the
  -- change carry no voted_at. Set by submit-vote, never by the client directly.
  voted_at   timestamptz
);

-- 2. Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Inserts go through the submit-vote Edge Function (service role).
-- Direct inserts from anon are intentionally blocked.
-- Edge Function source: supabase/functions/submit-vote/index.ts
-- CORS origin is hardcoded in index.ts:4 (ALLOWED_ORIGIN).
-- On domain change: update ALLOWED_ORIGIN and redeploy the function.

-- Allow anyone to read (for result polling)
CREATE POLICY "allow select" ON votes
  FOR SELECT USING (true);

-- No INSERT, UPDATE or DELETE policies for anon

-- 3. Grant read-only privileges to the anon role
GRANT SELECT ON votes TO anon;

-- Note (verified against the live DB 2026-09-07): anon additionally holds
-- TRUNCATE, REFERENCES and TRIGGER on votes. Those are not granted here — they
-- come from Supabase's default privileges on the public schema and reappear on
-- a rebuilt project. Not reachable through PostgREST, so no acute risk; to be
-- tidy, add: REVOKE TRUNCATE ON public.votes FROM anon;

-- 4. Aggregation function — returns vote counts per option
-- Avoids fetching all rows on the client; only totals are transferred
CREATE OR REPLACE FUNCTION get_vote_counts()
RETURNS TABLE(option smallint, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT option, COUNT(*) AS count
  FROM votes
  GROUP BY option;
$$;

GRANT EXECUTE ON FUNCTION get_vote_counts() TO anon;
