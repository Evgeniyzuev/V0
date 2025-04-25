-- Drop existing function
DROP FUNCTION IF EXISTS count_user_referrals(INTEGER);

-- Recreate with BIGINT parameter
CREATE OR REPLACE FUNCTION count_user_referrals(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    referral_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO referral_count
    FROM users
    WHERE referrer_id = p_telegram_id;

    RETURN COALESCE(referral_count, 0);
END;
$$ LANGUAGE plpgsql; 