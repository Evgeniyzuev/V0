import { createClientSupabaseClient } from '@/lib/supabase'
import type { Goal } from '@/types/supabase'

const supabase = createClientSupabaseClient();

export async function fetchGoals() {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error fetching goals:', error)
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
    throw error
  }

  return data
}

export async function updateGoal(id: number, updates: Partial<Goal>) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating goal:', error)
    throw error
  }

  return data
}

export const fetchUserGoals = async () => {
  const supabase = createClientSupabaseClient()
  
  const { data: userGoals, error } = await supabase
    .from('user_goals')
    .select(`
      *,
      goal:goals(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user goals:', error)
    throw error
  }

  // Transform the data to match the Goal type
  return userGoals.map(userGoal => ({
    ...userGoal.goal,
    progress_percentage: userGoal.progress_percentage,
    status: userGoal.status,
    notes: userGoal.notes
  }))
}

export async function addUserGoal(goalId: number) {
  const supabase = createClientSupabaseClient()
  
  // Get the current user's ID from the authenticated session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.user?.id) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('user_goals')
    .upsert({
      user_id: session.user.id,
      goal_id: goalId,
      status: 'not_started',
      progress_percentage: 0,
      current_step_index: 0,
      progress_details: { initialized: true }
    }, {
      onConflict: 'user_id,goal_id',
      ignoreDuplicates: true
    })
    .select(`
      *,
      goal:goals(*)
    `)
    .single()

  if (error) {
    console.error('Error adding user goal:', error)
    throw error
  }

  // Transform the data to match the Goal type
  return {
    ...data.goal,
    progress_percentage: data.progress_percentage,
    status: data.status,
    notes: data.notes
  }
} 