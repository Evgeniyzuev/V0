"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * TaskUpdater Component
 * 
 * Synchronizes user's tasks with available tasks from the tasks table.
 * Any task that exists in tasks but not in user_tasks gets added with 'assigned' status.
 */
export default function TaskUpdater({ onUpdate }: { onUpdate?: () => void }) {
  const { dbUser, isLoading: isUserLoading } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [debugError, setDebugError] = useState<string | null>(null)

  // Function to update user tasks
  const updateUserTasks = async () => {
    if (!dbUser?.id || isUpdating) return
    
    setIsUpdating(true)
    let tasksWereAdded = false
    
    try {
      // 1. Get all available tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("number")
        .order("number")
      
      if (tasksError) throw tasksError
      
      // 2. Get user's existing tasks
      const { data: userTasks, error: userTasksError } = await supabase
        .from("user_tasks")
        .select("task_id")
        .eq("user_id", dbUser.id)
      
      if (userTasksError) throw userTasksError
      
      // 3. Find tasks that user doesn't have
      const userTaskIds = userTasks?.map(task => task.task_id) || []
      const missingTasks = allTasks
        ?.filter(task => !userTaskIds.includes(task.number))
        ?.map(task => task.number) || []
      
      console.log('All task numbers:', allTasks?.map(t => t.number));
      console.log('User task IDs:', userTaskIds);
      console.log('Missing tasks to add:', missingTasks);
      
      // 4. If there are missing tasks, add them to user_tasks
      if (missingTasks.length > 0) {
        tasksWereAdded = true;
        const newUserTasks = missingTasks.map(taskId => ({
          user_id: dbUser.id,
          task_id: taskId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          current_step_index: 0,
          progress_details: { initialized: true }
        }))
        
        console.log('Adding these tasks:', newUserTasks);
        
        // Use upsert with ignoreDuplicates to prevent errors if tasks already exist
        const { error: upsertError } = await supabase
          .from("user_tasks")
          .upsert(newUserTasks, {
            onConflict: 'user_id, task_id', // Specify the columns for conflict detection
            ignoreDuplicates: true       // If conflict, do nothing
          })
        
        if (upsertError) throw upsertError; // Throw error if upsert fails for other reasons
      }

      // Call onUpdate if tasks were added or if it's a manual refresh
      if (tasksWereAdded || !isUserLoading) {
        onUpdate?.();
      }
    } catch (error: any) {
      console.error('Error updating tasks:', error)
      setDebugError(error?.message || 'Unknown error')
    } finally {
      setIsUpdating(false)
    }
  }

  // Auto-update tasks when component mounts and user is loaded
  useEffect(() => {
    if (dbUser?.id && !isUserLoading) {
      updateUserTasks()
    }
  }, [dbUser?.id, isUserLoading])

  if (isUserLoading || !dbUser?.id) {
    return null
  }

  return (
    <div className="inline-block">
      {debugError && <div className="text-red-500 text-xs mb-1">Debug Error: {debugError}</div>}
      <Button
        variant="ghost"
        size="icon"
        onClick={updateUserTasks}
        disabled={isUpdating}
        className="h-8 w-8"
      >
        <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
} 