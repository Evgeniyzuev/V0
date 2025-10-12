/**
 * Database schema types for the application
 */

/**
 * Represents the structure of the public.tasks table.
 */
export interface Task {
  id: number;
  title: string;
  icon_url: string | null;
  due_date: string | null; // ISO timestamp
  reward: number;
  description: string | null;
  notes: string | null;
  number: number;
  completion_condition: string | null;
}

/**
 * Represents the structure of the public.entries table.
 */
export interface Entry {
  id: number;
  text: string;
  created_at: string; // ISO timestamp
}

/**
 * Represents the structure of the public.users table.
 */
export interface User {
  id: string; // UUID
  telegram_id: number;
  referrer_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  reinvest: number;
  score_balance: number;
  wallet_balance: number;
  level: number;
  created_at: string; // ISO timestamp
  last_login_date: string | null; // ISO timestamp
  paid_referrals: number;
  phone_number: string | null;
  avatar_url: string | null;
  telegram_username: string | null;
  aicore_balance: number;
}

/**
 * Valid task status values
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Represents the structure of the public.user_tasks table.
 */
export interface UserTask {
  id: number;
  user_id: string; // Foreign key to users.id
  task_id: number; // Foreign key to tasks.id
  status: TaskStatus;
  assigned_at: string; // ISO timestamp
  current_step_index: number | null;
  progress_details: Record<string, any> | null; // JSON data
  notes: string | null;

  // Transformed task fields
  title?: string;
  icon_url?: string | null;
  due_date?: string | null;
  reward?: number;
  description?: string | null;
  number?: number;
  completion_condition?: string | null;
  steps_total?: number;

  // Optional: Include related data when fetching with joins
  task?: Task;
  // user?: User;
}

/**
 * Type for database schema
 */
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id'>;
        Update: Partial<Task>;
      };
      entries: {
        Row: Entry;
        Insert: Omit<Entry, 'id' | 'created_at'>;
        Update: Partial<Entry>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'last_login_date'>;
        Update: Partial<User>;
      };
      user_tasks: {
        Row: UserTask;
        Insert: Omit<UserTask, 'id'>;
        Update: Partial<UserTask>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at'>;
        Update: Partial<Omit<Goal, 'id' | 'created_at'>>;
      };
      user_goals: {
        Row: UserGoal;
        Insert: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserGoal, 'id' | 'user_id' | 'goal_id' | 'created_at' | 'updated_at'>>;
      };
    };
    Enums: {
      goal_status: GoalStatus;
      task_status: TaskStatus;
    };
    Functions: {
      // Add any DB functions you want typed here
    };
  };
}

/**
 * Represents a predefined goal template.
 */
export interface Goal {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  estimated_cost: string | null;
  steps: string[] | null;
  difficulty_level: number | null;
}

/**
 * Represents a specific user's instance of a goal.
 */
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned';

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
  started_at?: string | null;
  target_date?: string | null;
  completed_at?: string | null;
  current_step_index?: number | null;
  progress_details?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  goal?: {
    id: number;
    title: string;
    description?: string;
    created_at: string;
  };
}
