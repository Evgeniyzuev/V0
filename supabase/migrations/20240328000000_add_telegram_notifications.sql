-- Create table for telegram notification settings
CREATE TABLE IF NOT EXISTS telegram_notification_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    telegram_chat_id BIGINT,
    receive_interest_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_notification_user ON telegram_notification_settings(user_id);

-- Function to send telegram notification
CREATE OR REPLACE FUNCTION send_telegram_notification(
    p_user_id UUID,
    p_message TEXT
)
RETURNS void AS $$
DECLARE
    v_chat_id BIGINT;
BEGIN
    -- Get user's telegram chat ID
    SELECT telegram_chat_id INTO v_chat_id
    FROM telegram_notification_settings
    WHERE user_id = p_user_id
    AND receive_interest_notifications = true;

    -- If user has chat ID and wants notifications, send message
    IF v_chat_id IS NOT NULL THEN
        -- Here we'll use the telegram bot API to send the message
        -- This is a placeholder for the actual API call
        -- You'll need to implement the actual telegram bot integration
        RAISE NOTICE 'Sending telegram notification to chat %: %', v_chat_id, p_message;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the calculate_daily_interest function to send notifications
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
    notification_message TEXT;
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

        -- Send telegram notification
        notification_message := format(
            '💰 Daily Interest Update\n\n' ||
            'Interest earned: $%.8f\n' ||
            'Added to Core: $%.8f\n' ||
            'Added to Wallet: $%.8f\n' ||
            'Current Core balance: $%.2f',
            interest_amount,
            to_core,
            to_wallet,
            user_record.aicore_balance + to_core
        );
        
        PERFORM send_telegram_notification(user_record.id, notification_message);

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