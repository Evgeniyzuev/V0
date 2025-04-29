-- Create a function that combines both operations
CREATE OR REPLACE FUNCTION process_daily_interest_and_notifications()
RETURNS void AS $$
BEGIN
    -- Calculate interest
    PERFORM calculate_daily_interest();
    
    -- Wait for 1 minute to ensure all interest calculations are complete
    PERFORM pg_sleep(60);
    
    -- Send notifications
    PERFORM send_interest_notifications();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing cron job
SELECT cron.unschedule('calculate-daily-interest');

SELECT cron.schedule(
    'process-daily-interest',
    '0 0 * * *',  -- Every day at 00:00 UTC
    $$SELECT process_daily_interest_and_notifications()$$
); 