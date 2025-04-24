--1. Create table for interest history
CREATE TABLE IF NOT EXISTS interest_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    execution_date DATE NOT NULL,
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    core_balance_before DECIMAL NOT NULL,
    interest_amount DECIMAL NOT NULL,
    to_core DECIMAL NOT NULL,
    to_wallet DECIMAL NOT NULL,
    reinvest_percentage INTEGER NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster user history queries
CREATE INDEX IF NOT EXISTS idx_interest_history_user_id ON interest_history(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_history_date ON interest_history(execution_date);

-- Modify the calculate_daily_interest function to log individual transactions
CREATE OR REPLACE FUNCTION calculate_daily_interest()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    daily_rate DECIMAL := 0.000633; -- 0.0633% daily rate
    interest_amount DECIMAL;
    to_core DECIMAL;
    to_wallet DECIMAL;
    processed_count INTEGER := 0;
    total_interest_amount DECIMAL := 0;
    last_execution_date DATE;
BEGIN
    -- Check if already executed today
    SELECT execution_date INTO last_execution_date
    FROM interest_execution_log
    ORDER BY execution_date DESC
    LIMIT 1;

    IF last_execution_date = CURRENT_DATE THEN
        RAISE NOTICE 'Interest already calculated for today (%)', CURRENT_DATE;
        RETURN;
    END IF;

    -- Loop through all users
    FOR user_record IN 
        SELECT id, aicore_balance, reinvest 
        FROM users 
        WHERE aicore_balance > 0
    LOOP
        -- Calculate total interest
        interest_amount := user_record.aicore_balance * daily_rate;
        total_interest_amount := total_interest_amount + interest_amount;
        
        -- Split interest based on reinvest percentage
        to_core := interest_amount * (user_record.reinvest / 100);
        to_wallet := interest_amount * ((100 - user_record.reinvest) / 100);
        
        -- Log the transaction before updating balances
        INSERT INTO interest_history (
            user_id,
            execution_date,
            execution_time,
            core_balance_before,
            interest_amount,
            to_core,
            to_wallet,
            reinvest_percentage
        ) VALUES (
            user_record.id,
            CURRENT_DATE,
            CURRENT_TIMESTAMP,
            user_record.aicore_balance,
            interest_amount,
            to_core,
            to_wallet,
            user_record.reinvest
        );
        
        -- Update balances
        UPDATE users
        SET 
            aicore_balance = aicore_balance + to_core,
            wallet_balance = wallet_balance + to_wallet
        WHERE id = user_record.id;

        -- Log the operation
        PERFORM log_core_operation(
            user_record.id,
            to_core,
            'interest'
        );

        processed_count := processed_count + 1;
    END LOOP;

    -- Log the execution
    INSERT INTO interest_execution_log (
        execution_date,
        execution_time,
        processed_users,
        total_interest
    ) VALUES (
        CURRENT_DATE,
        CURRENT_TIMESTAMP,
        processed_count,
        total_interest_amount
    );
END;
$$ LANGUAGE plpgsql; 