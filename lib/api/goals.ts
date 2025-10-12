import { createClientSupabaseClient } from '@/lib/supabase'
import type { Goal, UserGoal } from '@/types/supabase'
import { toast } from 'sonner'

const supabase = createClientSupabaseClient();

export async function fetchGoals() {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error fetching goals:', error)
    toast.error('Error fetching goals: ' + error.message)
    throw error
  }

  return data
}

export async function fetchGoalById(id: number) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching goal:', error)
    toast.error('Error fetching goal: ' + error.message)
    throw error
  }

  return data
}

export async function updateGoal(id: number, updates: Partial<Goal>) {
  // First check if the goal exists
  const { data: existingGoal, error: fetchError } = await supabase
    .from('goals')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching goal for update:', fetchError)
    toast.error('Goal not found: ' + fetchError.message)
    throw fetchError
  }

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating goal:', error)
    toast.error('Error updating goal: ' + error.message)
    throw error
  }

  return data
}

export const fetchUserGoals = async (userId: string | undefined) => {
  if (!userId) {
    console.log('fetchUserGoals: No user ID provided, returning empty array.');
    return []; // Возвращаем пустой массив, если нет user ID
  }

  const supabase = createClientSupabaseClient()
  
  console.log(`Fetching user goals for user ID: ${userId}...`)
  const { data: userGoals, error } = await supabase
    .from('user_goals')
    .select(`
      *,
      goal:goals(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user goals:', error)
    toast.error('Error fetching user goals: ' + error.message)
    throw error
  }

  console.log('Fetched user goals:', userGoals)
  return userGoals as UserGoal[]; // Return the raw data as UserGoal array
}

/**
 * Adds a specific goal to a user's personal goals list.
 * Uses upsert to avoid duplicates based on the unique constraint (user_id, goal_id).
 */
export const addUserGoal = async (userId: string, goalId: number): Promise<UserGoal | null> => {
  const supabase = createClientSupabaseClient()

  // Optionally, fetch the goal details to get difficulty or other defaults
  const { data: goalTemplate, error: fetchError } = await supabase
    .from('goals')
    .select('difficulty_level')
    .eq('id', goalId)
    .single()

  if (fetchError) {
    console.error('Error fetching goal template details:', fetchError)
    toast.error('Could not fetch goal details: ' + fetchError.message)
    // Decide if you want to proceed without defaults or throw error
  }

  const newUserGoalData: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userId,
    goal_id: goalId,
    status: 'not_started',
    started_at: null,
    target_date: null,
    completed_at: null,
    progress_percentage: 0,
    current_step_index: null,
    progress_details: null,
    notes: undefined,
    difficulty_level: goalTemplate?.difficulty_level ?? undefined,
    title: undefined,
    description: undefined,
    image_url: undefined,
    estimated_cost: undefined,
    steps: undefined
  }

  const { data, error: upsertError } = await supabase
    .from('user_goals')
    .upsert([newUserGoalData], { // Pass data as an array
      onConflict: 'user_id, goal_id', // Assumes unique constraint exists
      ignoreDuplicates: false // Set to false to ensure it attempts update/select on conflict
    })
    .select() // Select the data after upsert
    .single() // Expecting one row back

  if (upsertError) {
    console.error('Error adding/upserting user goal:', upsertError)
    // Don't show toast error if it's just a duplicate conflict (code 23505 - unique_violation)
    if (upsertError.code !== '23505') {
        toast.error('Failed to add goal: ' + upsertError.message)
    }
    return null
  }

  console.log('Successfully added/found user goal:', data)
  // No toast success here, let the caller decide based on context
  return data
}

export const removeUserGoal = async (userId: string, goalId: number): Promise<void> => {
  const supabase = createClientSupabaseClient()

  const { error } = await supabase
    .from('user_goals')
    .delete()
    .match({ user_id: userId, id: goalId })

  if (error) {
    console.error('Error removing user goal:', error)
    toast.error('Failed to remove goal: ' + error.message)
    throw error
  }

  console.log('Successfully removed user goal')
}
