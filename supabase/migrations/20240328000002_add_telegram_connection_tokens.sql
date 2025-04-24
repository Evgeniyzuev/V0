-- Create table for telegram connection tokens
CREATE TABLE IF NOT EXISTS telegram_connection_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    UNIQUE(token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_token_user ON telegram_connection_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_token_expires ON telegram_connection_tokens(expires_at);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM telegram_connection_tokens
    WHERE expires_at < CURRENT_TIMESTAMP
    OR is_used = true;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job to run every hour
SELECT cron.schedule(
    'clean-expired-tokens',
    '0 * * * *',
    $$SELECT clean_expired_tokens()$$
); 