-- Add new task for AI assistant interaction
INSERT INTO tasks (number, title, reward, icon_url, description, completion_condition)
VALUES (
    4,
    'Meet Your AI Assistant',
    1,
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>',
    'Get to know your AI assistant. This powerful tool will help you on your journey. Send your first message to start the conversation.

Instructions:
1. Click on the AI Assistant tab
2. Type any message in the chat
3. Press Enter or click Send',
    'User must send at least one message to the AI Assistant.'
)
ON CONFLICT (number) DO NOTHING; 