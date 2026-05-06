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

-- Allow anyone to insert (anonymous vote)
CREATE POLICY "allow insert" ON votes
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read (for result polling)
CREATE POLICY "allow select" ON votes
  FOR SELECT USING (true);

-- No UPDATE or DELETE policies — not needed, not allowed

-- 3. Grant basic table privileges to the anon role
-- RLS alone is not enough — Postgres also requires table-level GRANTs
GRANT SELECT, INSERT ON votes TO anon;
