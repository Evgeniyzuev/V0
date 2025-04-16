export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface DbGoal {
  id: string;
  title: string;
  description?: string;
}

export interface DbTask {
  id: string;
  title: string;
  description?: string;
}

export interface UserGoalRecord {
  id: string;
  goal_id: string;
  status: string;
  progress_percentage?: number;
  notes?: string;
  goals?: DbGoal;
}

export interface UserTaskRecord {
  id: string;
  task_id: string;
  status: string;
  priority?: string;
  due_date?: string;
  tasks?: DbTask;
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
  user_goals?: UserGoalRecord[];
  user_tasks?: UserTaskRecord[];
  goals?: UserGoal[];
  tasks?: UserTask[];
  skills?: string[];
  interests?: string[];
  preferences?: {
    interestAreas?: string[];
    communicationStyle?: 'formal' | 'casual';
    focusAreas?: string[];
    reminderFrequency?: 'daily' | 'weekly' | 'never';
  };
}

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

export interface UserContext {
  profile: UserProfile;
  goals: UserGoal[];
  tasks: UserTask[];
  lastInteraction?: string;
}

export interface AIAssistantContext {
  profile: {
    id: string;
    name: string;
    level: number;
    skills: string[];
    interests: string[];
    experience: number;
  };
  goals: UserGoal[];
  tasks: UserTask[];
  lastInteraction?: string;
  preferences?: {
    communicationStyle?: 'formal' | 'casual';
    focusAreas?: string[];
    reminderFrequency?: 'daily' | 'weekly' | 'never';
  };
}

export function createAIContext(dbUser: DbUser): AIAssistantContext {
  console.log('Creating AI Context from user data:', {
    id: dbUser.id,
    goals: dbUser.goals?.length || 0,
    tasks: dbUser.tasks?.length || 0
  });

  return {
    profile: {
      id: dbUser.id,
      name: dbUser.first_name || dbUser.telegram_username || 'there',
      level: dbUser.level || 1,
      skills: dbUser.skills || [],
      interests: dbUser.preferences?.interestAreas || [],
      experience: dbUser.core || 0
    },
    goals: (dbUser.goals || []).map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      progress: calculateGoalProgress(goal),
      status: goal.status,
      priority: goal.priority,
      dueDate: goal.dueDate,
      tasks: goal.tasks
    })),
    tasks: (dbUser.tasks || []).map(task => ({
      id: task.id,
      goalId: task.goalId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority || 'medium',
      dueDate: task.dueDate
    })),
    preferences: dbUser.preferences || {}
  };
}

function calculateGoalProgress(goal: UserGoal): number {
  if (!goal.tasks?.length) return 0;
  const completedTasks = goal.tasks.filter(task => task.status === 'DONE').length;
  return Math.round((completedTasks / goal.tasks.length) * 100);
} 