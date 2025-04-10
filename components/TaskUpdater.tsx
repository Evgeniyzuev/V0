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
export default function TaskUpdater() {
  const { dbUser, isLoading: isUserLoading } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [debugError, setDebugError] = useState<string | null>(null)

  // Function to update user tasks
  const updateUserTasks = async () => {
    if (!dbUser?.id || isUpdating) return
    
    setIsUpdating(true)
    
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
    <div className="flex justify-end mb-3 flex-col">
      {debugError && <div className="text-red-500 text-xs mb-1">Debug Error: {debugError}</div>}
      <Button
        variant="outline"
        size="sm"
        onClick={updateUserTasks}
        disabled={isUpdating}
        className="flex items-center gap-2"
      >
        {isUpdating ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Update Tasks
      </Button>
    </div>
  )
} 