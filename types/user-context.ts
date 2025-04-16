import type { Database } from "./supabase"
import type { GoalStatus } from "./supabase"

type DbGoal = Database['public']['Tables']['user_goals']['Row']
type DbTask = Database['public']['Tables']['tasks']['Row']

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
  goals?: DbGoal[];
  tasks?: DbTask[];
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
      id: String(goal.id),
      title: goal.title || '',
      description: goal.description || '',
      progress: goal.progress_percentage || 0,
      status: mapGoalStatus(goal.status),
      priority: goal.difficulty_level || 1,
      dueDate: goal.target_date || undefined,
      tasks: []
    })),
    tasks: (dbUser.tasks || []).map(task => ({
      id: String(task.id),
      goalId: task.goal_id ? String(task.goal_id) : undefined,
      title: task.title,
      description: task.description || '',
      status: 'TODO',
      priority: 'medium',
      dueDate: task.due_date || undefined
    })),
    preferences: dbUser.preferences || {}
  };
}

function mapGoalStatus(status: GoalStatus): 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED' {
  const statusMap: Record<GoalStatus, 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'> = {
    'not_started': 'BACKLOG',
    'in_progress': 'IN_PROGRESS',
    'completed': 'DONE',
    'paused': 'BACKLOG',
    'abandoned': 'ARCHIVED'
  };
  return statusMap[status] || 'BACKLOG';
}

function mapTaskStatus(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
  const statusMap: Record<string, 'TODO' | 'IN_PROGRESS' | 'DONE'> = {
    'pending': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'completed': 'DONE',
    'failed': 'TODO'
  };
  return statusMap[status.toLowerCase()] || 'TODO';
} 