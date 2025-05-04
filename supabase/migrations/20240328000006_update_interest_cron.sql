-- Update the existing cron job
SELECT cron.unschedule('calculate-daily-interest');

SELECT cron.schedule(
    'process-daily-interest',
    '0 0 * * *',  -- Every day at 00:00 UTC
    $$SELECT calculate_daily_interest()$$
); 