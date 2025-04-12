import { createClientSupabaseClient } from '@/lib/supabase'
import type { Goal } from '@/types/supabase'
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

export const fetchUserGoals = async () => {
  const supabase = createClientSupabaseClient()
  
  console.log('Fetching user goals...')
  const { data: userGoals, error } = await supabase
    .from('user_goals')
    .select(`
      *,
      goal:goals(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user goals:', error)
    toast.error('Error fetching user goals: ' + error.message)
    throw error
  }

  console.log('Fetched user goals:', userGoals)

  // Transform the data to match the Goal type
  const transformedGoals = userGoals.map(userGoal => ({
    ...userGoal.goal,
    progress_percentage: userGoal.progress_percentage,
    status: userGoal.status,
    notes: userGoal.notes
  }))

  console.log('Transformed goals:', transformedGoals)
  return transformedGoals
} 