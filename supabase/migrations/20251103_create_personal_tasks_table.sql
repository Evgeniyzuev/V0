-- Migration: create personal_tasks table
-- Creates a single table that stores personal tasks with JSON lists for subtasks and resources

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.personal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subtasks jsonb DEFAULT '[]'::jsonb,
  resources jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'open', -- open | completed | canceled
  progress_percentage integer DEFAULT 0,
  legacy_source text, -- optional: original source (wish/note/challenge)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_id ON public.personal_tasks(user_id);
