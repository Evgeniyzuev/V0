-- Create unified results table for items, books, achievements, base, and character
CREATE TABLE IF NOT EXISTS public.results (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('achievement', 'item', 'book', 'base', 'character')),
  img TEXT, -- URL, emoji, or other image representation
  title VARCHAR(255) NOT NULL,
  description TEXT,
  info JSONB, -- Additional structured data (subtitle, count, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_results_type ON public.results(type);
CREATE INDEX IF NOT EXISTS idx_results_title ON public.results(title);

-- Enable Row Level Security
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your user access requirements)
-- For now, allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read results" ON public.results
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update their own results if needed
-- (You may want to add user_id column if results should be user-specific)
CREATE POLICY "Allow authenticated users to manage results" ON public.results
  FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
