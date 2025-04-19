-- Add new task for calculating time to target
INSERT INTO tasks (number, title, reward, icon_url, description, completion_condition)
VALUES (
    3,
    'Calculate Time to Target',
    1,
    '/icons/calculator.svg',
    'Learn to use the Time to Target calculator to plan your Core growth journey. This tool will help you understand how long it will take to reach your desired Core amount based on your current settings.',
    'User must use the Time to Target calculator by entering a target amount and clicking Calculate.'
)
ON CONFLICT (number) DO NOTHING;
