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
      // Throw an error so the calling component knows it failed
      throw new Error('User not logged in');
    }

    const newUserGoal: Omit<UserGoal, 'id' | 'created_at' | 'updated_at' | 'image_url' | 'description'> = {
      user_id: dbUser.id,
      goal_id: goal.id,
      status: 'not_started',
      started_at: null,
      target_date: null,
      completed_at: null,
      progress_percentage: 0,
      current_step_index: null,
      progress_details: null,
      notes: null, // Notes can be added later by the user
      difficulty_level: goal.difficulty_level, // Inherit difficulty
      // image_url and description are intentionally left out
      // as they should be inherited from the joined 'goal' table
      // when fetched via fetchUserGoals
    }
    
    const { data, error: upsertError } = await supabase
      .from("user_goals")
      .upsert([newUserGoal], {
        onConflict: 'user_id, goal_id',
        // Let's change ignoreDuplicates to false to get the data back if it exists
        // Although we don't use 'data' currently, it might be useful later.
        // If it's a duplicate, it won't throw an error but data will be null.
        ignoreDuplicates: false 
      })
      .select() // Select the inserted/updated row
      .single() // We expect one row

    if (upsertError) {
      console.error('Error adding goal:', upsertError)
      // Avoid duplicate error toast if it's just a conflict (unique_violation)
      if (upsertError.code !== '23505') { 
        toast.error('Failed to add goal: ' + upsertError.message)
      } else {
        // Optionally, inform the user it was already added
        toast.info('Goal already exists in your list.')
      }
      // Throw an error to signal failure to the calling component
      throw upsertError;
    }

    // Invalidate and refetch user goals to update the UI
    await queryClient.invalidateQueries({ queryKey: ['user-goals', dbUser.id] })

    // Show success message!
    toast.success('✨ Goal successfully added!')
  }

  useImperativeHandle(ref, () => ({
    addGoalToUserGoals
  }))

  return null // This is a utility component that doesn't render anything
})

export default GoalUpdater 