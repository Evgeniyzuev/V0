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
            url := 'https://api.telegram.org/bot8189008759:AAGD8FOOHjlrGqHVLHeru-KGtuSj5bIZkwE/sendMessage',
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