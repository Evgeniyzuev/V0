/**
 * Represents the structure of the public.tasks table.
 */
export interface Task {
  id: number; // Assuming 'number' from TasksTab corresponds to an ID field, adjust if needed
  number: number; // Keeping this as per TasksTab usage, might be redundant with id
  title: string;
  reward: number;
  icon_url: string | null;
  description: string | null;
  due_date: string | null; // Consider using Date or ISOString type for consistency
  notes: string | null;
  category?: string | null; // Added based on previous discussion
  steps_definition?: any | null; // Added based on previous discussion, use a more specific type if possible
  created_at?: string; // Standard Supabase timestamp
}

/**
 * Represents the structure of the public.profiles table (linked to auth.users).
 * Adjust fields based on your actual table structure.
 */
export interface Profile {
  id: string; // Typically UUID from auth.users
  user_id: string; // Foreign key to auth.users.id
  username: string | null;
  avatar_url: string | null;
  full_name?: string | null;
  // Add other relevant profile fields
  created_at?: string;
  updated_at?: string;
}

/**
 * Represents the structure of the new public.user_tasks table.
 * (v2: removed completed_at, updated_at; task_id references tasks.number)
 */
export interface UserTask {
  id: number; // Or string if using UUID
  user_id: string; // Foreign key to auth.users.id or profiles.user_id
  task_id: number; // Foreign key to tasks.number (assuming tasks.number is number type)
  status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'pending_review' | 'archived';
  assigned_at: string; // ISOString format
  current_step_index: number | null;
  progress_details: any | null; // Use a more specific type based on your needs
  notes: string | null;

  // Optional: Include related data if you fetch it using joins
  tasks?: Task; // Associated task details
  profiles?: Profile; // Associated user profile details
} 