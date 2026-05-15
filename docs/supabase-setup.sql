-- Puls Questionnaire — Supabase Setup
-- Run this in the Supabase SQL Editor

-- 1. Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option     smallint NOT NULL CHECK (option BETWEEN 1 AND 4),
  device_id  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
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

-- 4. Aggregation function — returns vote counts per option
-- Avoids fetching all rows on the client; only totals are transferred
CREATE OR REPLACE FUNCTION get_vote_counts()
RETURNS TABLE(option smallint, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT option, COUNT(*) AS count
  FROM votes
  GROUP BY option;
$$;

GRANT EXECUTE ON FUNCTION get_vote_counts() TO anon;
