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
export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'failed' | 'pending_review' | 'archived';

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
  task?: Task;
  user?: User;
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
    };
  };
} 