// Define base types needed for AI Assistant context
export interface UserGoal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
  priority?: number;
  dueDate?: string;
  tasks?: UserTask[];
}

export interface UserTask {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  level: number;
  skills: string[];
  interests: string[];
  experience: number;
}

export interface AIAssistantContext {
  profile: UserProfile;
  goals: UserGoal[];
  tasks: UserTask[];
  lastInteraction?: string;
  preferences?: {
    communicationStyle?: 'formal' | 'casual';
    focusAreas?: string[];
    reminderFrequency?: 'daily' | 'weekly' | 'never';
  };
}

interface UserData {
  id: string;
  first_name?: string;
  telegram_username?: string;
  level?: number;
  skills?: string[];
  interests?: string[];
  goals?: UserGoal[];
  tasks?: UserTask[];
}

export function createAIContext(user: UserData): AIAssistantContext {
  return {
    profile: {
      id: user.id,
      name: user.first_name || user.telegram_username || 'there',
      level: user.level || 1,
      skills: user.skills || [],
      interests: user.interests || [],
      experience: 0 // This could be calculated based on goals/tasks completion
    },
    goals: user.goals || [],
    tasks: user.tasks || [],
    preferences: {
      communicationStyle: 'casual',
      focusAreas: user.interests || [],
      reminderFrequency: 'daily'
    }
  };
}

function calculateGoalProgress(goal: UserGoal): number {
  if (!goal.tasks?.length) return 0;
  const completedTasks = goal.tasks.filter((task: UserTask) => task.status === 'DONE').length;
  return Math.round((completedTasks / goal.tasks.length) * 100);
} 