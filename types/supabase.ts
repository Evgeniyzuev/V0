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
  reinvest_setup: number;
  score_balance: number;
  wallet_balance: number;
  level: number;
  created_at: string; // ISO timestamp
  last_login_date: string | null; // ISO timestamp
  paid_referrals: number;
  phone_number: string | null;
  avatar_url: string | null;
  telegram_username: string | null;
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

  // Optional: Include related data when fetching with joins
  // task?: Task;
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
  id: number; // Primary Key
  created_at: string; // timestamp with time zone default now()
  title: string; // Text, not null
  description: string | null; // Text
  image_url: string | null; // Text, stores URL
  estimated_cost: string | null; // Text, e.g., "$5,000", "10 hours"
  steps: string[] | null; // Array of strings, stored as jsonb
  difficulty_level: number | null; // Added: e.g., 1 (easy) to 5 (hard)
  // Potential future additions:
  // category: string | null;
}

/**
 * Represents a specific user's instance of a goal.
 */
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned';

export interface UserGoal {
  id: number; // Primary Key
  user_id: string; // Foreign key to auth.users.id, not null
  goal_id: number; // Foreign key to goals.id, not null
  image_url: string | null; // Text, stores URL
  description: string | null; // Text
  created_at: string; // timestamp with time zone default now()
  updated_at: string; // timestamp with time zone default now()
  status: GoalStatus; // Text, using the GoalStatus type, not null, default 'not_started'
  started_at: string | null; // timestamp with time zone
  target_date: string | null; // date type might be better if time is not relevant
  completed_at: string | null; // timestamp with time zone
  progress_percentage: number | null; // Smallint (0-100)
  current_step_index: number | null; // Integer
  progress_details: Record<string, any> | null; // JSONB, e.g., { step_0_completed: true, saved_amount: 1200 }
  notes: string | null; // Text
  difficulty_level: number | null; // Added: Copied from goal or user-defined

  // Optional: Include related data when fetching with joins
  // goal?: Goal;
} 