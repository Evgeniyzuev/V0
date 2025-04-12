-- Drop existing foreign key constraint
ALTER TABLE public.user_goals
DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey;

-- Change user_id column type to match public.users.id
ALTER TABLE public.user_goals
ALTER COLUMN user_id TYPE text;

-- Add new foreign key constraint referencing public.users
ALTER TABLE public.user_goals
ADD CONSTRAINT user_goals_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE; 