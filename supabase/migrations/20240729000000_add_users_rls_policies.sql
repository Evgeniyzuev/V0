-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Allow querying by telegram_id" ON public.users;
DROP POLICY IF EXISTS "Allow querying by referrer_id" ON public.users;
DROP POLICY IF EXISTS "Allow inserting new users" ON public.users;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to perform all operations
CREATE POLICY "Service role has full access"
  ON public.users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow querying by telegram_id for authenticated users
CREATE POLICY "Allow querying by telegram_id"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow querying by referrer_id for authenticated users
CREATE POLICY "Allow querying by referrer_id"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow inserting new users without RLS checks
CREATE POLICY "Allow inserting new users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.users IS 'Users table with RLS policies for data protection'; 