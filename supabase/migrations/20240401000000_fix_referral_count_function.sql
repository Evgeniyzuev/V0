-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.count_user_referrals(BIGINT);
DROP FUNCTION IF EXISTS public.count_user_referrals(INTEGER);

-- Create the function with correct signature
CREATE OR REPLACE FUNCTION public.count_user_referrals(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.users
    WHERE referrer_id = p_telegram_id
  );
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_referral_count ON public.users;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET paid_referrals = count_user_referrals(NEW.referrer_id::BIGINT)
    WHERE telegram_id = NEW.referrer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.referrer_id IS DISTINCT FROM NEW.referrer_id THEN
      -- Update old referrer's count
      UPDATE public.users
      SET paid_referrals = count_user_referrals(OLD.referrer_id::BIGINT)
      WHERE telegram_id = OLD.referrer_id;
      
      -- Update new referrer's count
      UPDATE public.users
      SET paid_referrals = count_user_referrals(NEW.referrer_id::BIGINT)
      WHERE telegram_id = NEW.referrer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET paid_referrals = count_user_referrals(OLD.referrer_id::BIGINT)
    WHERE telegram_id = OLD.referrer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_referral_count
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_referral_count(); 