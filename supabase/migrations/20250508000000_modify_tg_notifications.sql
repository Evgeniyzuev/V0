-- Переопределяем функцию отправки уведомлений, чтобы она брала chat_id из users
CREATE OR REPLACE FUNCTION send_telegram_notification(
    p_user_id UUID,
    p_message TEXT
)
RETURNS void AS $$
DECLARE
    v_chat_id BIGINT;
    v_response JSONB;
BEGIN
    -- Get user's telegram chat ID directly from users table
    SELECT telegram_chat_id INTO v_chat_id
    FROM users
    WHERE id = p_user_id;

    -- If user has chat ID, send message (ignore notification settings)
    IF v_chat_id IS NOT NULL THEN
        -- Call our service to send the message via POST
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

-- Переопределяем функцию для рассылки уведомлений о процентах
-- Теперь она отправляет всем пользователям с chat_id, подставляя 0, если начислений не было
CREATE OR REPLACE FUNCTION send_interest_notifications()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    notification_message TEXT;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_error_message TEXT;
BEGIN
    -- Получаем всех пользователей с telegram_chat_id
    FOR user_record IN
        SELECT
            u.id,
            u.telegram_chat_id,
            COALESCE(ih.interest_amount, 0) AS interest_amount, -- Используем COALESCE для подстановки 0
            u.aicore_balance
        FROM users u
        LEFT JOIN interest_history ih ON u.id = ih.user_id AND ih.execution_date = CURRENT_DATE -- LEFT JOIN, чтобы включить всех пользователей
        WHERE u.telegram_chat_id IS NOT NULL -- Отправляем только тем, у кого есть chat_id
    LOOP
        BEGIN
            -- Формируем сообщение с 8 знаками после запятой и переносом строки
            notification_message := format(
                'Daily Interest earned: <code>$%s</code>.&#10;Current Core balance: <code>$%s</code>.',
                to_char(user_record.interest_amount, '0.00000000'), -- Формат с ведущим нулём
                to_char(user_record.aicore_balance, '0.00000000') -- Формат с ведущим нулём
            );

            -- Отправляем уведомление через обновлённую функцию
            PERFORM send_telegram_notification(user_record.id, notification_message);
            v_success_count := v_success_count + 1;

            -- Лог успешной отправки (опционально, можно убрать, если не нужен)
            INSERT INTO notification_log (user_id, notification_type, status, message, created_at)
            VALUES (user_record.id, 'interest', 'success', notification_message, CURRENT_TIMESTAMP);

        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_error_message := SQLERRM;