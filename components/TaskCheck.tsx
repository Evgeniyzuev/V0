"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/components/UserContext"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Define task verification interfaces
interface TaskCheckProps {
  taskNumber: number
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}

// Main component to handle task verification
export default function TaskCheck({ taskNumber, onComplete, onCancel }: TaskCheckProps) {
  const { dbUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle task completion for task number 1
  const verifyTask = async () => {
    // Check if user is authenticated
    if (!dbUser?.id) {
      onComplete(false, "You must be logged in to complete this task")
      return
    }

    // Only proceed for task number 1
    if (taskNumber !== 1) {
      onComplete(false, "Only task #1 can be verified at this time")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if user already has this task
      const { data: existingTask } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", dbUser.id)
        .eq("task_id", taskNumber)
        .single()

      let result
      
      if (existingTask) {
        // Update existing task
        result = await supabase
          .from("user_tasks")
          .update({
            status: "completed",
            current_step_index: existingTask.current_step_index + 1,
            progress_details: {
              ...existingTask.progress_details,
              [`step_${existingTask.current_step_index}_completed`]: true,
              last_attempt_message: "Task verification successful"
            }
          })
          .eq("id", existingTask.id)
      } else {
        // Create new task entry
        result = await supabase
          .from("user_tasks")
          .insert({
            user_id: dbUser.id,
            task_id: taskNumber,
            status: "completed",
            current_step_index: 1,
            progress_details: {
              step_0_completed: true,
              last_attempt_message: "Task verification successful"
            }
          })
      }

      if (result.error) {
        throw result.error
      }

      // Add reward to user's wallet
      const { data: taskData } = await supabase
        .from("tasks")
        .select("reward")
        .eq("number", taskNumber)
        .single()

      if (taskData?.reward) {
        await supabase
          .from("users")
          .update({
            wallet_balance: (dbUser.wallet_balance || 0) + taskData.reward
          })
          .eq("id", dbUser.id)
      }

      onComplete(true, "Task #1 completed successfully!")
    } catch (err) {
      console.error("Error completing task:", err)
      setError("Failed to complete task. Please try again.")
      onComplete(false, "Failed to complete task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Task #1 Verification</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Please confirm that you've completed Task #1. This requires you to be logged in.
          </p>
          
          <div className="flex gap-3 mt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={verifyTask}
              disabled={!dbUser?.id}
            >
              <Check className="h-4 w-4 mr-2" />
              Verify Task #1
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 