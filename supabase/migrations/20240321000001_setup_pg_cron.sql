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
  v_execution_date DATE;
  v_total_interest DECIMAL(20,8) := 0;
  v_processed_users INTEGER := 0;
  v_user RECORD;
  v_interest_amount DECIMAL(20,8);
BEGIN
  -- Get current date in UTC
  v_execution_date := timezone('utc'::text, now())::date;
  
  -- Check if already executed today
  IF EXISTS (
    SELECT 1 FROM interest_execution_log 
    WHERE execution_date = v_execution_date
  ) THEN
    RAISE NOTICE 'Interest already calculated for today (%)', v_execution_date;
    RETURN;
  END IF;
  
  -- Process each user
  FOR v_user IN 
    SELECT id, aicore_balance, reinvest 
    FROM users 
    WHERE aicore_balance > 0
  LOOP
    -- Calculate interest
    v_interest_amount := v_user.aicore_balance * 0.000633; -- 0.0633% daily interest
    
    -- Update user balance
    UPDATE users 
    SET aicore_balance = aicore_balance + v_interest_amount
    WHERE id = v_user.id;
    
    -- Log the operation
    PERFORM log_core_operation(v_user.id, v_interest_amount, 'interest');
    
    v_total_interest := v_total_interest + v_interest_amount;
    v_processed_users := v_processed_users + 1;
  END LOOP;
  
  -- Log execution
  INSERT INTO interest_execution_log (
    execution_date,
    execution_time,
    processed_users,
    total_interest
  ) VALUES (
    v_execution_date,
    timezone('utc'::text, now()),
    v_processed_users,
    v_total_interest
  );
  
  RAISE NOTICE 'Daily interest calculation completed. Processed % users, total interest: %', 
    v_processed_users, v_total_interest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run daily at 00:00 UTC
SELECT cron.schedule(
    'calculate-daily-interest',
    '0 0 * * *',
    $$SELECT calculate_daily_interest()$$
); 