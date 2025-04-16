export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface DbUser {
  id: string;
  user_id?: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  created_at?: string;
  wallet_balance?: number;
  aicore_balance?: number;
  level?: number;
  core?: number;
  paid_referrals?: number;
  reinvest_setup?: number;
  referrer_id?: number;
  goals?: UserGoal[];
  tasks?: UserTask[];
  skills?: string[];
  interests?: string[];
}

export interface UserGoal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
  priority?: number;
  dueDate?: string;
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

export interface UserContext {
  profile: UserProfile;
  goals: UserGoal[];
  tasks: UserTask[];
  lastInteraction?: string;
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

export function createAIContext(user: any): AIAssistantContext {
  return {
    profile: {
      id: user.id,
      name: user.first_name || user.telegram_username || 'there',
      level: user.level || 1,
      skills: user.skills || [],
      interests: (user.preferences?.interestAreas as string[]) || [],
      experience: user.experience || 0
    },
    goals: (user.goals || []).map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      progress: calculateGoalProgress(goal),
      status: goal.status,
      priority: goal.priority,
      dueDate: goal.dueDate
    })),
    tasks: (user.tasks || []).map((task: any) => ({
      id: task.id,
      goalId: task.goalId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority || 'medium',
      dueDate: task.dueDate
    })),
    preferences: user.preferences || {}
  };
}

function calculateGoalProgress(goal: any): number {
  if (!goal.tasks?.length) return 0;
  const completedTasks = goal.tasks.filter((task: any) => task.status === 'DONE').length;
  return Math.round((completedTasks / goal.tasks.length) * 100);
} 