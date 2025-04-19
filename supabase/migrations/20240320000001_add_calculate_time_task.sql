-- Add new task for calculating time to target
INSERT INTO tasks (number, title, reward, icon_url, description, completion_condition)
VALUES (
    3,
    'Calculate Time to Target',
    1,
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4h16v16H4V4z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="16" r="2" fill="currentColor"/>
    </svg>',
    'Learn to use the Time to Target calculator to plan your Core growth journey. This tool will help you understand how long it will take to reach your desired Core amount based on your current settings.

Instructions:
1. Go to Finance tab
2. Switch to Core tab
3. Scroll down to Time to Target calculator
4. Enter your desired Core amount
5. Click Calculate button',
    'User must use the Time to Target calculator by entering a target amount and clicking Calculate.'
)
ON CONFLICT (number) DO NOTHING;
