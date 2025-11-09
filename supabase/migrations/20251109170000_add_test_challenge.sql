-- Update task 2 with test materials (assuming it exists from previous attempts)
UPDATE public.tasks SET
  title = 'Multi-Material Challenge',
  reward = 50,
  icon_url = '/placeholder.svg',
  description = 'Test challenge with PDF, video, and link materials',
  completion_condition = 'Complete all materials',
  verification_type = 'manual',
  materials = '[
    {
      "type": "pdf",
      "url": "https://example.com/test.pdf",
      "title": "Test PDF Document",
      "downloadable": true
    },
    {
      "type": "video",
      "url": "https://example.com/test-video.mp4",
      "title": "Test Video Tutorial"
    },
    {
      "type": "link",
      "url": "https://example.com/test-link",
      "title": "External Resource"
    }
  ]'::jsonb,
  verification_config = '{"custom_field": "test_value"}'::jsonb
WHERE number = 2;

-- If task 2 doesn't exist, create it
INSERT INTO public.tasks (
  number,
  title,
  reward,
  icon_url,
  description,
  completion_condition,
  verification_type,
  materials,
  verification_config
)
SELECT
  2,
  'Multi-Material Challenge',
  50,
  '/placeholder.svg',
  'Test challenge with PDF, video, and link materials',
  'Complete all materials',
  'manual',
  '[
    {
      "type": "pdf",
      "url": "https://example.com/test.pdf",
      "title": "Test PDF Document",
      "downloadable": true
    },
    {
      "type": "video",
      "url": "https://example.com/test-video.mp4",
      "title": "Test Video Tutorial"
    },
    {
      "type": "link",
      "url": "https://example.com/test-link",
      "title": "External Resource"
    }
  ]'::jsonb,
  '{"custom_field": "test_value"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE number = 2);

-- Assign to all users for testing
INSERT INTO public.user_tasks (user_id, task_id, status, assigned_at, current_step_index, progress_details, notes)
SELECT
  u.id as user_id,
  2 as task_id,
  'assigned' as status,
  NOW() as assigned_at,
  0 as current_step_index,
  '{}' as progress_details,
  'Test the universal challenge system!' as notes
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_tasks ut
  WHERE ut.user_id = u.id AND ut.task_id = 2
)
ON CONFLICT (user_id, task_id) DO NOTHING;
