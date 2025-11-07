-- Migration: add streak fields to personal_tasks table
-- Adds fields to support daily streak tracking for tasks

ALTER TABLE public.personal_tasks
ADD COLUMN IF NOT EXISTS is_streak_task boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date date,
ADD COLUMN IF NOT EXISTS streak_start_date date;

-- Add check constraint to ensure current_streak_days doesn't exceed total_streak_days
ALTER TABLE public.personal_tasks
ADD CONSTRAINT check_streak_days
CHECK (current_streak_days <= total_streak_days);

-- Add index for better query performance on streak tasks
CREATE INDEX IF NOT EXISTS idx_personal_tasks_is_streak_task ON public.personal_tasks(is_streak_task) WHERE is_streak_task = true;
