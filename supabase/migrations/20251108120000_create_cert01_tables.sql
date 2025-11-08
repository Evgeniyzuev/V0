-- Create certificate_cards table (stores all certificate data with pre-calculated reaction counts)
CREATE TABLE IF NOT EXISTS public.certificate_cards (
    id SERIAL PRIMARY KEY,
    certificate_code VARCHAR(50) NOT NULL, -- 'cert01', 'cert02', etc.
    card_order INTEGER NOT NULL, -- order within the certificate (0 = description card)
    card_type VARCHAR(20) NOT NULL DEFAULT 'learning' CHECK (card_type IN ('description', 'learning')),
    was_image_url VARCHAR(500),
    became_image_url VARCHAR(500),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    -- Pre-calculated reaction counts as JSON for fast loading
    reaction_counts JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(certificate_code, card_order)
);

-- Create user_certificate_interactions table (unified for ratings, comments, reactions, and progress)
CREATE TABLE IF NOT EXISTS public.user_certificate_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    certificate_code VARCHAR(50) NOT NULL,
    card_id INTEGER NOT NULL REFERENCES public.certificate_cards(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('rating', 'comment', 'reaction', 'progress')),
    target_type VARCHAR(20) DEFAULT 'card' CHECK (target_type IN ('card', 'comment')), -- for reactions: what the reaction is on
    target_id INTEGER DEFAULT NULL, -- for reactions: which card/comment is being reacted to
    content TEXT, -- rating value (1-3), comment text, reaction type (heart, thumbs_up, etc.), progress type (viewed, completed)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one interaction per user per card per type
    UNIQUE(user_id, certificate_code, card_id, interaction_type, target_type, target_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_cards_code ON public.certificate_cards(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificate_cards_order ON public.certificate_cards(certificate_code, card_order);
CREATE INDEX IF NOT EXISTS idx_user_cert_interactions_user_id ON public.user_certificate_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cert_interactions_cert ON public.user_certificate_interactions(certificate_code, card_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_cert_interactions_target ON public.user_certificate_interactions(certificate_code, target_type, target_id, interaction_type);

-- Enable Row Level Security
ALTER TABLE public.certificate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificate_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- certificate_cards policies (public read)
CREATE POLICY "Anyone can view certificate cards" ON public.certificate_cards
    FOR SELECT USING (true);

-- user_certificate_interactions policies (unified for ratings, comments, reactions, progress)
CREATE POLICY "Users can view their own interactions" ON public.user_certificate_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_certificate_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.user_certificate_interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.user_certificate_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update reaction counts in certificate_cards (JSONB)
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' AND NEW.interaction_type = 'reaction' AND NEW.target_type = 'card' THEN
        -- Get current count or default to 0
        SELECT COALESCE((reaction_counts->>NEW.content)::INTEGER, 0) INTO current_count
        FROM public.certificate_cards
        WHERE id = NEW.card_id;

        -- Update the JSONB field
        UPDATE public.certificate_cards
        SET reaction_counts = jsonb_set(reaction_counts, array[NEW.content], to_jsonb(current_count + 1))
        WHERE id = NEW.card_id;

        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.interaction_type = 'reaction' AND OLD.target_type = 'card' THEN
        -- Get current count
        SELECT COALESCE((reaction_counts->>OLD.content)::INTEGER, 0) INTO current_count
        FROM public.certificate_cards
        WHERE id = OLD.card_id;

        -- Update the JSONB field (ensure count doesn't go below 0)
        UPDATE public.certificate_cards
        SET reaction_counts = jsonb_set(reaction_counts, array[OLD.content], to_jsonb(GREATEST(current_count - 1, 0)))
        WHERE id = OLD.card_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain reaction counts
CREATE TRIGGER maintain_reaction_counts
    AFTER INSERT OR DELETE ON public.user_certificate_interactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_certificate_cards_updated_at BEFORE UPDATE ON public.certificate_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_cert_interactions_updated_at BEFORE UPDATE ON public.user_certificate_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert certificate description card (card_order = 0)
INSERT INTO public.certificate_cards (certificate_code, card_order, card_type, title, description) VALUES
('cert01', 0, 'description', 'Learning Journey Certificate', 'A comprehensive learning experience with 4 transformative lessons')
ON CONFLICT (certificate_code, card_order) DO NOTHING;

-- Insert certificate learning cards for cert01
INSERT INTO public.certificate_cards (certificate_code, card_order, card_type, was_image_url, became_image_url, title, description, category) VALUES
('cert01', 1, 'learning', '/cert01/was-1.jpg', '/cert01/became-1.jpg', 'From Chaos to Clarity', 'Learn how to organize your thoughts and create structured plans for success.', 'Mindset'),
('cert01', 2, 'learning', '/cert01/was-2.jpg', '/cert01/became-2.jpg', 'Building Consistent Habits', 'Discover the power of daily routines and how small actions lead to big results.', 'Habits'),
('cert01', 3, 'learning', '/cert01/was-3.jpg', '/cert01/became-3.jpg', 'Financial Freedom Path', 'Master the fundamentals of personal finance and wealth building.', 'Finance'),
('cert01', 4, 'learning', '/cert01/was-4.jpg', '/cert01/became-4.jpg', 'Goal Achievement Mastery', 'Transform your dreams into achievable goals with proven strategies.', 'Goals')
ON CONFLICT (certificate_code, card_order) DO NOTHING;
