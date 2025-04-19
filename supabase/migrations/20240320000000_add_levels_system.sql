-- Create level_thresholds table
CREATE TABLE IF NOT EXISTS level_thresholds (
    level INTEGER PRIMARY KEY,
    core_requirement DECIMAL NOT NULL
);


-- Insert level thresholds
INSERT INTO level_thresholds (level, core_requirement)
VALUES
    (1, 2),
    (2, 4),
    (3, 8),
    (4, 16),
    (5, 32),
    (6, 64),
    (7, 125),
    (8, 250),
    (9, 500),
    (10, 1000),
    (11, 2000),
    (12, 4000),
    (13, 8000),
    (14, 16000),
    (15, 32000),
    (16, 64000),
    (17, 125000),
    (18, 250000),
    (19, 500000),
    (20, 1000000),
    (21, 2000000),
    (22, 4000000),
    (23, 8000000),
    (24, 16000000),
    (25, 32000000),
    (26, 64000000),
    (27, 125000000),
    (28, 250000000),
    (29, 500000000),
    (30, 1000000000)
ON CONFLICT (level) DO UPDATE 
SET core_requirement = EXCLUDED.core_requirement;

-- Create function to update user level
CREATE OR REPLACE FUNCTION update_user_level(user_id UUID) 
RETURNS INTEGER AS $$
DECLARE
    new_level INTEGER;
BEGIN
    SELECT level INTO new_level
    FROM level_thresholds
    WHERE core_requirement <= (
        SELECT aicore_balance 
        FROM users 
        WHERE id = user_id
    )
    ORDER BY level DESC
    LIMIT 1;

    UPDATE users 
    SET level = COALESCE(new_level, 0)
    WHERE id = user_id;

    RETURN COALESCE(new_level, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function for wallet top up
CREATE OR REPLACE FUNCTION top_up_wallet(
    p_user_id UUID,
    p_amount DECIMAL
) RETURNS JSON AS $$
DECLARE
    new_balance DECIMAL;
BEGIN
    UPDATE users 
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
    WHERE id = p_user_id
    RETURNING wallet_balance INTO new_balance;

    RETURN json_build_object(
        'new_balance', new_balance
    );
END;
$$ LANGUAGE plpgsql;

-- Create function for core transfer with level update
CREATE OR REPLACE FUNCTION transfer_to_core(
    p_user_id UUID,
    p_amount DECIMAL
) RETURNS JSON AS $$
DECLARE
    new_wallet_balance DECIMAL;
    new_core_balance DECIMAL;
    new_level INTEGER;
BEGIN
    -- Check if user has enough funds
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND COALESCE(wallet_balance, 0) >= p_amount
    ) THEN
        RAISE EXCEPTION 'Insufficient funds in wallet';
    END IF;

    -- Update balances
    UPDATE users 
    SET 
        wallet_balance = COALESCE(wallet_balance, 0) - p_amount,
        aicore_balance = COALESCE(aicore_balance, 0) + p_amount
    WHERE id = p_user_id
    RETURNING wallet_balance, aicore_balance 
    INTO new_wallet_balance, new_core_balance;

    -- Update level
    new_level := update_user_level(p_user_id);

    RETURN json_build_object(
        'new_wallet_balance', new_wallet_balance,
        'new_core_balance', new_core_balance,
        'new_level', new_level
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic level updates on balance change
CREATE OR REPLACE FUNCTION trigger_update_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.aicore_balance IS DISTINCT FROM OLD.aicore_balance THEN
        PERFORM update_user_level(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_level_on_balance_change ON users;
CREATE TRIGGER update_level_on_balance_change
    AFTER UPDATE OF aicore_balance ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_level(); 