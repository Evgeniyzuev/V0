-- Create a function to manually trigger interest calculation
CREATE OR REPLACE FUNCTION trigger_manual_interest_calculation()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Call the interest calculation function
    PERFORM calculate_daily_interest();
    
    -- Get the last execution log
    SELECT json_build_object(
        'status', 'success',
        'message', 'Interest calculation triggered successfully',
        'execution_time', CURRENT_TIMESTAMP
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM,
            'execution_time', CURRENT_TIMESTAMP
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check interest calculation status
CREATE OR REPLACE FUNCTION check_interest_calculation_status()
RETURNS JSON AS $$
DECLARE
    last_execution RECORD;
    result JSON;
BEGIN
    -- Get the last execution from interest_execution_log
    SELECT * INTO last_execution
    FROM interest_execution_log
    ORDER BY execution_date DESC
    LIMIT 1;
    
    IF last_execution IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'No interest calculations have been performed yet',
            'last_execution', NULL
        );
    END IF;
    
    RETURN json_build_object(
        'status', 'success',
        'last_execution_date', last_execution.execution_date,
        'last_execution_time', last_execution.execution_time,
        'processed_users', last_execution.processed_users,
        'total_interest', last_execution.total_interest
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 