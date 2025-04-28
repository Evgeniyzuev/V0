-- Enable the http extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

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
    v_response JSONB;
    v_url TEXT;
BEGIN
    -- Get user's telegram chat ID
    SELECT telegram_chat_id INTO v_chat_id
    FROM telegram_notification_settings
    WHERE user_id = p_user_id
    AND receive_interest_notifications = true;

    -- If user has chat ID and wants notifications, send message
    IF v_chat_id IS NOT NULL THEN
        -- Construct URL with parameters
        v_url := format(
            'https://api.telegram.org/bot8189008759:AAGD8FOOHjlrGqHVLHeru-KGtuSj5bIZkwE/sendMessage?chat_id=%s&text=%s&parse_mode=HTML',
            v_chat_id,
            urlencode(p_message)
        );
        
        -- Send GET request
        SELECT content::jsonb INTO v_response
        FROM extensions.http_get(v_url);
        
        -- Log the response for debugging
        RAISE NOTICE 'Telegram API response: %', v_response;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate daily interest
CREATE OR REPLACE FUNCTION calculate_daily_interest()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    daily_rate NUMERIC(20,8) := 0.00063300; -- 0.0633% daily rate with 8 decimal places
    interest_amount NUMERIC(20,8);
    to_core NUMERIC(20,8);
    to_wallet NUMERIC(20,8);
    processed_count INTEGER := 0;
    total_interest_amount NUMERIC(20,8) := 0;
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
        -- Calculate total interest with explicit type casting
        interest_amount := (user_record.aicore_balance::NUMERIC(20,8) * daily_rate)::NUMERIC(20,8);
        total_interest_amount := total_interest_amount + interest_amount;
        
        -- Split interest based on reinvest percentage
        to_core := (interest_amount * (user_record.reinvest::NUMERIC(20,8) / 100::NUMERIC(20,8)))::NUMERIC(20,8);
        to_wallet := (interest_amount * ((100::NUMERIC(20,8) - user_record.reinvest::NUMERIC(20,8)) / 100::NUMERIC(20,8)))::NUMERIC(20,8);
        
        -- Log the transaction
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

-- Function to send notifications for all users
CREATE OR REPLACE FUNCTION send_interest_notifications()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    notification_message TEXT;
BEGIN
    -- Get all users who received interest today
    FOR user_record IN 
        SELECT 
            u.id,
            u.aicore_balance,
            ih.interest_amount,
            ih.to_core,
            ih.to_wallet
        FROM users u
        JOIN interest_history ih ON u.id = ih.user_id
        WHERE ih.execution_date = CURRENT_DATE
    LOOP
        -- Format notification message
        notification_message := format(
            '💰 Daily Interest Update\n\n' ||
            'Interest earned: $%s\n' ||
            'Added to Core: $%s\n' ||
            'Added to Wallet: $%s\n' ||
            'Current Core balance: $%s',
            to_char(user_record.interest_amount, 'FM999999999.99999999'),
            to_char(user_record.to_core, 'FM999999999.99999999'),
            to_char(user_record.to_wallet, 'FM999999999.99999999'),
            to_char(user_record.aicore_balance, 'FM999999999.99')
        );
        
        -- Send notification
        PERFORM send_telegram_notification(user_record.id, notification_message);
    END LOOP;
END;
$$ LANGUAGE plpgsql; 