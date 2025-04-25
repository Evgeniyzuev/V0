-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.count_user_referrals;

-- Create function to count user referrals with bigint parameter
CREATE OR REPLACE FUNCTION public.count_user_referrals(user_id bigint)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::bigint
  FROM public.users
  WHERE referrer_id = user_id;
$$; 