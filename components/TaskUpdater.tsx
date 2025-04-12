"use client"

import { useState, useEffect, useRef } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

// Initialize Supabase client
const supabase = createClientSupabaseClient();

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
  const initialLoadDone = useRef(false)

  // Function to update user tasks
  const updateUserTasks = async (isManualRefresh = false) => {
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
        
        // Use upsert with ignoreDuplicates to prevent errors if tasks already exist
        const { error: upsertError } = await supabase
          .from("user_tasks")
          .upsert(newUserTasks, {
            onConflict: 'user_id, task_id',
            ignoreDuplicates: true
          })
        
        if (upsertError) throw upsertError;
      }

      // Call onUpdate only if:
      // 1. New tasks were actually added, or
      // 2. It's a manual refresh (user clicked the button)
      if (tasksWereAdded || isManualRefresh) {
        onUpdate?.();
      }
    } catch (error: any) {
      console.error('Error updating tasks:', error)
      setDebugError(error?.message || 'Unknown error')
    } finally {
      setIsUpdating(false)
    }
  }

  // Auto-update tasks only on initial mount
  useEffect(() => {
    if (dbUser?.id && !isUserLoading) {
      updateUserTasks(false)
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
        onClick={() => updateUserTasks(true)}
        disabled={isUpdating}
        className="h-8 w-8"
      >
        <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
} 