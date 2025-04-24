-- Create table for tracking interest views
CREATE TABLE IF NOT EXISTS interest_view_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    last_view_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, last_view_date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interest_view_user_date ON interest_view_tracking(user_id, last_view_date);

-- Function to update last view date
CREATE OR REPLACE FUNCTION update_interest_view_date(user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO interest_view_tracking (user_id, last_view_date)
    VALUES (user_id, CURRENT_DATE)
    ON CONFLICT (user_id, last_view_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 