-- Run this SQL in Supabase SQL Editor to allow stock inserts
-- This creates a temporary policy that allows anonymous inserts

-- Drop existing temp policies if any
DROP POLICY IF EXISTS "Allow anonymous inserts" ON "Stock";
DROP POLICY IF EXISTS "Allow anonymous updates" ON "Stock";

-- Create INSERT policy for anon role
CREATE POLICY "Allow anonymous inserts" ON "Stock"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create UPDATE policy for anon role  
CREATE POLICY "Allow anonymous updates" ON "Stock"
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow inserts for other tables needed for seeding
DROP POLICY IF EXISTS "Allow anonymous inserts" ON "SectorStats";
CREATE POLICY "Allow anonymous inserts" ON "SectorStats"
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous updates" ON "SectorStats";
CREATE POLICY "Allow anonymous updates" ON "SectorStats"
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous inserts" ON "MarketParams";
CREATE POLICY "Allow anonymous inserts" ON "MarketParams"
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

SELECT 'RLS policies created successfully!' as result;
