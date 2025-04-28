-- Drop existing cron job if it exists
SELECT cron.unschedule('calculate-daily-interest');

-- Create a new cron job that runs at 00:00 UTC every day
SELECT cron.schedule(
    'calculate-daily-interest',
    '0 0 * * *',
    $$
    BEGIN
        -- Set the timezone to UTC
        SET timezone = 'UTC';
        
        -- Call the interest calculation function
        PERFORM calculate_daily_interest();
        
        -- Log the execution
        INSERT INTO cron_log (
            job_name,
            execution_time,
            status,
            message
        ) VALUES (
            'calculate-daily-interest',
            CURRENT_TIMESTAMP,
            'success',
            'Daily interest calculation completed'
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Log any errors
            INSERT INTO cron_log (
                job_name,
                execution_time,
                status,
                message
            ) VALUES (
                'calculate-daily-interest',
                CURRENT_TIMESTAMP,
                'error',
                SQLERRM
            );
    END;
    $$
);

-- Create a table to log cron job executions
CREATE TABLE IF NOT EXISTS cron_log (
    id SERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cron_log_job_name ON cron_log(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_log_execution_time ON cron_log(execution_time DESC); 