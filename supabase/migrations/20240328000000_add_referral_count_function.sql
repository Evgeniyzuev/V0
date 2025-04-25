-- First, create the counting function
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

-- Then create the trigger function that uses count_user_referrals
CREATE OR REPLACE FUNCTION update_referral_count_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the referrer's count when a new user is added or referrer_id changes
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.referrer_id IS DISTINCT FROM OLD.referrer_id) THEN
        -- Update the new referrer's count
        IF NEW.referrer_id IS NOT NULL THEN
            UPDATE users
            SET paid_referrals = count_user_referrals(NEW.referrer_id)
            WHERE telegram_id = NEW.referrer_id;
        END IF;
        
        -- Update the old referrer's count if this is an UPDATE and referrer_id changed
        IF TG_OP = 'UPDATE' AND OLD.referrer_id IS NOT NULL AND OLD.referrer_id != NEW.referrer_id THEN
            UPDATE users
            SET paid_referrals = count_user_referrals(OLD.referrer_id)
            WHERE telegram_id = OLD.referrer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_referral_count ON users;
CREATE TRIGGER update_referral_count
    AFTER INSERT OR UPDATE OF referrer_id ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_count_on_change();

-- Finally, update all existing counts
UPDATE users u
SET paid_referrals = (
    SELECT COUNT(*)
    FROM users r
    WHERE r.referrer_id = u.telegram_id
); 