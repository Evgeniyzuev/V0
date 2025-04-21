-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create table for tracking interest execution
CREATE TABLE IF NOT EXISTS interest_execution_log (
    id SERIAL PRIMARY KEY,
    execution_date DATE NOT NULL,
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_users INTEGER NOT NULL,
    total_interest DECIMAL NOT NULL
);

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_interest_execution_date ON interest_execution_log(execution_date);

-- Create function to calculate daily interest
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
        
        -- Update balances
        UPDATE users
        SET 
            aicore_balance = aicore_balance + to_core,
            wallet_balance = wallet_balance + to_wallet
        WHERE id = user_record.id;

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

-- Schedule the job to run daily at 00:00 UTC
SELECT cron.schedule(
    'calculate-daily-interest',
    '0 0 * * *',
    $$SELECT calculate_daily_interest()$$
); 