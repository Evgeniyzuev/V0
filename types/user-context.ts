// Define base types needed for AI Assistant context
export interface UserGoal {
  id: number;
  user_id: string;
  goal_id: number | null;
  title?: string;
  description?: string;
  image_url?: string;
  estimated_cost?: string;
  difficulty_level?: number;
  steps?: string[];
  notes?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'archived';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  goalId?: number;
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
      experience: 0
    },
    goals: user.goals?.map(goal => ({
      ...goal,
      progress: goal.progress_percentage
    })) || [],
    tasks: user.tasks || [],
    preferences: {
      communicationStyle: 'casual',
      focusAreas: user.interests || [],
      reminderFrequency: 'daily'
    }
  };
}

function calculateGoalProgress(goal: UserGoal): number {
  return goal.progress_percentage;
} 