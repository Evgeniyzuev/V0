-- Create function to log core operations
CREATE OR REPLACE FUNCTION log_core_operation(
    p_user_id UUID,
    p_amount NUMERIC,
    p_type TEXT
) RETURNS UUID AS $$
DECLARE
    v_operation_id UUID;
BEGIN
    -- 1.Insert the operation into core_operations table
    INSERT INTO core_operations (
        user_id,
        amount,
        type
    ) VALUES (
        p_user_id,
        p_amount,
        p_type
    )
    RETURNING id INTO v_operation_id;

    RETURN v_operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 