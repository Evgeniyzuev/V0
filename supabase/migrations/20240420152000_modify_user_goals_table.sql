-- Make goal_id nullable and add title, description, image_url fields
ALTER TABLE public.user_goals
  ALTER COLUMN goal_id DROP NOT NULL;

-- Add check constraint to ensure either goal_id is set or title is not null
ALTER TABLE public.user_goals
  ADD CONSTRAINT user_goals_goal_or_title_check 
  CHECK ((goal_id IS NOT NULL) OR (title IS NOT NULL));

-- Update RLS policies to allow users to create their own goals
CREATE POLICY "Users can create their own goals"
  ON public.user_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the change
COMMENT ON TABLE public.user_goals IS 'User-specific instances of goals with progress tracking. Can be either linked to a template goal or be a custom user goal.'; 