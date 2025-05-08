-- Update the send_telegram_notification function to use our service
CREATE OR REPLACE FUNCTION send_telegram_notification(
    p_user_id UUID,
    p_message TEXT
)
RETURNS void AS $$
DECLARE
    v_chat_id BIGINT;
    v_response JSONB;
BEGIN
    -- Get user's telegram chat ID
    SELECT telegram_chat_id INTO v_chat_id
    FROM telegram_notification_settings
    WHERE user_id = p_user_id
    AND receive_interest_notifications = true;

    -- If user has chat ID and wants notifications, send message
    IF v_chat_id IS NOT NULL THEN
        -- Call our service to send the message
        SELECT content::jsonb INTO v_response
        FROM net.http_post(
            url := 'https://api.telegram.org/bot' || current_setting('app.telegram_bot_token') || '/sendMessage',
            body := jsonb_build_object(
                'chat_id', v_chat_id,
                'text', p_message,
                'parse_mode', 'HTML'
            )
        );

        -- Log the response for debugging
        RAISE NOTICE 'Telegram API response: %', v_response;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Простая функция для рассылки сообщения всем с telegram_id
CREATE OR REPLACE FUNCTION mass_notify_telegram_users()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    notification_message TEXT;
    v_url TEXT;
    v_response JSONB;
    v_interest_amount DECIMAL;
BEGIN
    FOR user_record IN SELECT u.id, u.telegram_id, u.aicore_balance FROM users u WHERE u.telegram_id IS NOT NULL LOOP
        -- Получаем начисление за сегодня (или 0)
        SELECT COALESCE(ih.interest_amount, 0) INTO v_interest_amount
        FROM interest_history ih
        WHERE ih.user_id = user_record.id AND ih.execution_date = CURRENT_DATE;

        -- Формируем сообщение
        notification_message := format(
            'Daily Interest earned: <code>$%s</code>.&#10;Current Core balance: <code>$%s</code>.',
            to_char(v_interest_amount, '0.00000000'),
            to_char(user_record.aicore_balance, '0.00000000')
        );

        BEGIN
            v_url := format(
                'https://api.telegram.org/bot%s/sendMessage?chat_id=%s&text=%s&parse_mode=HTML',
                '8189008759:AAGD8FOOHjlrGqHVLHeru-KGtuSj5bIZkwE',
                user_record.telegram_id,
                urlencode(notification_message)
            );
            SELECT content::jsonb INTO v_response FROM extensions.http_get(v_url);
            RAISE NOTICE 'Sent to %: %', user_record.telegram_id, v_response;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to send to %: %', user_record.telegram_id, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 