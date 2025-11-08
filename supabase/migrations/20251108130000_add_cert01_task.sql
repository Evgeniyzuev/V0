-- Migration: Add cert_01 task to tasks table and assign to all users
-- Timestamp: Set this to the current timestamp when creating the file

-- 1. Add cert_01 task to tasks table
INSERT INTO public.tasks (number, title, reward, icon_url, description, completion_condition)
VALUES (
  1,
  'Learning Journey Certificate',
  100,
  '/cert01/icon.jpg',
  'Complete the comprehensive learning journey with 4 transformative lessons about mindset, habits, finance, and goals.',
  'Cert01'
)
ON CONFLICT (number) DO NOTHING;

-- 2. Assign cert_01 task to all existing users
INSERT INTO public.user_tasks (user_id, task_id, status, assigned_at, current_step_index, progress_details, notes)
SELECT
  u.id as user_id,
  1 as task_id,
  'assigned' as status,
  NOW() as assigned_at,
  0 as current_step_index,
  '{}' as progress_details,
  'Start your learning journey!' as notes
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_tasks ut
  WHERE ut.user_id = u.id AND ut.task_id = 1
)
ON CONFLICT (user_id, task_id) DO NOTHING;

-- 3. Create a trigger to automatically assign cert_01 task to new users
CREATE OR REPLACE FUNCTION assign_cert01_task_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_tasks (user_id, task_id, status, assigned_at, current_step_index, progress_details, notes)
  VALUES (
    NEW.id,
    1,
    'assigned',
    NOW(),
    0,
    '{}',
    'Start your learning journey!'
  )
  ON CONFLICT (user_id, task_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on users table
DROP TRIGGER IF EXISTS trigger_assign_cert01_task ON public.users;
CREATE TRIGGER trigger_assign_cert01_task
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_cert01_task_to_new_user();
