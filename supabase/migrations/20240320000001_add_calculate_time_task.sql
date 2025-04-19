-- Add new task for calculating time to target
INSERT INTO tasks (number, title, reward, icon_url, description, completion_condition, steps_total)
VALUES (
    3, -- Adjust number if needed
    'Calculate Time to Target',
    1, -- Reward amount
    '/icons/calculator.svg', -- Update with actual icon path
    'Learn to use the Time to Target calculator to plan your Core growth journey. This tool will help you understand how long it will take to reach your desired Core amount based on your current settings.',
    'User must use the Time to Target calculator by entering a target amount and clicking Calculate.',
    1
)
ON CONFLICT (number) DO NOTHING;
