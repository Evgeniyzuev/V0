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

-- Create user_certificate_interactions table (consolidated - one row per user-card)
CREATE TABLE IF NOT EXISTS public.user_certificate_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    certificate_code VARCHAR(50) NOT NULL,
    card_id INTEGER NOT NULL REFERENCES public.certificate_cards(id) ON DELETE CASCADE,
    -- Consolidated fields (one row per user-card)
    progress VARCHAR(20), -- 'viewed', 'completed'
    rating INTEGER CHECK (rating >= 1 AND rating <= 3), -- 1-3 stars
    comment TEXT, -- user's comment text
    reactions JSONB DEFAULT '[]', -- array of reaction types: ['heart', 'thumbs_up']
    -- Unique constraint: one row per user per card
    UNIQUE(user_id, certificate_code, card_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_cards_code ON public.certificate_cards(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificate_cards_order ON public.certificate_cards(certificate_code, card_order);
CREATE INDEX IF NOT EXISTS idx_user_cert_interactions_user_id ON public.user_certificate_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cert_interactions_cert ON public.user_certificate_interactions(certificate_code, card_id);

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

-- Function to update reaction counts in certificate_cards (consolidated table)
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
    added_reactions TEXT[];
    removed_reactions TEXT[];
    reaction_type TEXT;
BEGIN
    -- Handle INSERT or UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Find newly added reactions (in NEW but not in OLD)
        IF TG_OP = 'INSERT' THEN
            added_reactions := ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.reactions, '[]'::jsonb)));
        ELSE
            added_reactions := ARRAY(
                SELECT jsonb_array_elements_text(COALESCE(NEW.reactions, '[]'::jsonb))
                EXCEPT
                SELECT jsonb_array_elements_text(COALESCE(OLD.reactions, '[]'::jsonb))
            );
        END IF;

        -- Find removed reactions (in OLD but not in NEW)
        IF TG_OP = 'UPDATE' THEN
            removed_reactions := ARRAY(
                SELECT jsonb_array_elements_text(COALESCE(OLD.reactions, '[]'::jsonb))
                EXCEPT
                SELECT jsonb_array_elements_text(COALESCE(NEW.reactions, '[]'::jsonb))
            );
        END IF;

        -- Increment counts for added reactions
        FOREACH reaction_type IN ARRAY added_reactions LOOP
            UPDATE public.certificate_cards
            SET reaction_counts = jsonb_set(
                COALESCE(reaction_counts, '{}'),
                array[reaction_type],
                to_jsonb(COALESCE((reaction_counts->>reaction_type)::INTEGER, 0) + 1)
            )
            WHERE id = NEW.card_id;
        END LOOP;

        -- Decrement counts for removed reactions
        FOREACH reaction_type IN ARRAY removed_reactions LOOP
            UPDATE public.certificate_cards
            SET reaction_counts = jsonb_set(
                COALESCE(reaction_counts, '{}'),
                array[reaction_type],
                to_jsonb(GREATEST(COALESCE((reaction_counts->>reaction_type)::INTEGER, 0) - 1, 0))
            )
            WHERE id = NEW.card_id;
        END LOOP;

        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Decrement counts for all reactions in the deleted row
        removed_reactions := ARRAY(SELECT jsonb_array_elements_text(COALESCE(OLD.reactions, '[]'::jsonb)));

        FOREACH reaction_type IN ARRAY removed_reactions LOOP
            UPDATE public.certificate_cards
            SET reaction_counts = jsonb_set(
                COALESCE(reaction_counts, '{}'),
                array[reaction_type],
                to_jsonb(GREATEST(COALESCE((reaction_counts->>reaction_type)::INTEGER, 0) - 1, 0))
            )
            WHERE id = OLD.card_id;
        END LOOP;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain reaction counts
CREATE TRIGGER maintain_reaction_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.user_certificate_interactions
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
