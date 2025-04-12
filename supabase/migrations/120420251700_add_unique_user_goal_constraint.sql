    -- Add unique constraint for user_id and goal_id in user_goals table
    ALTER TABLE public.user_goals
    ADD CONSTRAINT user_goals_user_id_goal_id_key UNIQUE (user_id, goal_id);