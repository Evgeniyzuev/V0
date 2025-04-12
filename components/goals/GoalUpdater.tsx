import { createClientSupabaseClient } from '@/lib/supabase'
import type { Goal, UserGoal } from '@/types/supabase'
import { useUser } from '@/components/UserContext'
import { useQueryClient } from '@tanstack/react-query'
import { forwardRef, useImperativeHandle } from 'react'
import { toast } from 'sonner'

interface GoalUpdaterProps {
  goals: Goal[]
}

export interface GoalUpdaterRef {
  addGoalToUserGoals: (goal: Goal) => Promise<void>
}

const GoalUpdater = forwardRef<GoalUpdaterRef, GoalUpdaterProps>(({ goals }, ref) => {
  const { dbUser } = useUser()
  const queryClient = useQueryClient()
  const supabase = createClientSupabaseClient()

  const addGoalToUserGoals = async (goal: Goal) => {
    console.log('Adding goal to user goals:', { goal, userId: dbUser?.id })
    if (!dbUser?.id) {
      toast.error('No user ID found. Please log in.')
      return
    }

    const newUserGoal: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'> = {
      user_id: dbUser.id,
      goal_id: goal.id,
      image_url: goal.image_url,
      description: goal.description,
      status: 'not_started',
      started_at: null,
      target_date: null,
      completed_at: null,
      progress_percentage: 0,
      current_step_index: null,
      progress_details: null,
      notes: null,
      difficulty_level: goal.difficulty_level
    }
    
    const { data, error: upsertError } = await supabase
      .from("user_goals")
      .upsert([newUserGoal], {
        onConflict: 'user_id, goal_id',
        ignoreDuplicates: true
      })

    if (upsertError) {
      console.error('Error adding goal:', upsertError)
      toast.error('Failed to add goal: ' + upsertError.message)
      return
    }

    // Invalidate and refetch user goals
    await queryClient.invalidateQueries({ queryKey: ['user-goals'] })
  }

  useImperativeHandle(ref, () => ({
    addGoalToUserGoals
  }))

  return null // This is a utility component that doesn't render anything
})

export default GoalUpdater 