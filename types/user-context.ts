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
  description: string;
  targetDate?: string;
  progress: number;
}

export interface UserTask {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  goalId?: string;
}

export interface UserProfile {
  name: string;
  level: number;
  experience: number;
  skills: string[];
  interests: string[];
}

export interface UserContext {
  profile: UserProfile;
  goals: UserGoal[];
  tasks: UserTask[];
  lastInteraction?: string;
}

export function createAIContext(dbUser: DbUser): AIAssistantContext {
  return {
    profile: {
      name: dbUser.first_name || dbUser.telegram_username || 'User',
      level: dbUser.level || 1,
      experience: dbUser.core || 0,
      skills: dbUser.skills || [],
      interests: dbUser.interests || [],
    },
    goals: dbUser.goals || [],
    tasks: dbUser.tasks || [],
    lastInteraction: new Date().toISOString(),
  };
}

export interface AIAssistantContext {
  profile: {
    name: string;
    level: number;
    experience: number;
    skills: string[];
    interests: string[];
  };
  goals: UserGoal[];
  tasks: UserTask[];
  lastInteraction?: string;
} 