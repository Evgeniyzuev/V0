"use client"

import { useState } from "react"
import { Check, Timer, ExternalLink, FileText, Upload, MapPin, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

// Main component to handle different task verifications
export default function TaskCheck({ taskNumber, onComplete, onCancel }: TaskCheckProps) {
  const { dbUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle task completion
  const completeTask = async (success: boolean, message: string = "") => {
    if (!dbUser?.id) {
      onComplete(false, "User not authenticated")
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
            status: success ? "completed" : "failed",
            current_step_index: existingTask.current_step_index + 1,
            progress_details: {
              ...existingTask.progress_details,
              [`step_${existingTask.current_step_index}_completed`]: success,
              last_attempt_message: message
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
            status: success ? "completed" : "failed",
            current_step_index: success ? 1 : 0,
            progress_details: {
              step_0_completed: success,
              last_attempt_message: message
            }
          })
      }

      if (result.error) {
        throw result.error
      }

      // If task completed successfully, add reward to user's wallet
      if (success) {
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
      }

      onComplete(success, message)
    } catch (err) {
      console.error("Error completing task:", err)
      setError("Failed to complete task. Please try again.")
      onComplete(false, "Failed to complete task. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Render appropriate verification component based on task number
  const renderVerificationComponent = () => {
    // Simple tasks (1-10): Basic verification
    if (taskNumber >= 1 && taskNumber <= 10) {
      return <SimpleTaskCheck onComplete={completeTask} onCancel={onCancel} />
    }
    
    // Social tasks (11-20): Link verification
    else if (taskNumber >= 11 && taskNumber <= 20) {
      return <LinkVerificationTask onComplete={completeTask} onCancel={onCancel} />
    }
    
    // Location tasks (21-30): Geo verification
    else if (taskNumber >= 21 && taskNumber <= 30) {
      return <LocationVerificationTask onComplete={completeTask} onCancel={onCancel} />
    }
    
    // Document tasks (31-40): File verification
    else if (taskNumber >= 31 && taskNumber <= 40) {
      return <FileUploadTask onComplete={completeTask} onCancel={onCancel} />
    }
    
    // Time-based tasks (41-50): Time verification
    else if (taskNumber >= 41 && taskNumber <= 50) {
      return <TimeBasedTask onComplete={completeTask} onCancel={onCancel} />
    }
    
    // Default to simple verification for unknown task types
    return <SimpleTaskCheck onComplete={completeTask} onCancel={onCancel} />
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Task Verification</h3>
      
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
        renderVerificationComponent()
      )}
    </div>
  )
}

// Simple task verification (e.g., "I completed this task")
function SimpleTaskCheck({ onComplete, onCancel }: { 
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Please confirm that you've completed this task according to the requirements.
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
          onClick={() => onComplete(true, "Task manually verified")}
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm
        </Button>
      </div>
    </div>
  )
}

// Link verification component
function LinkVerificationTask({ onComplete, onCancel }: {
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}) {
  const [link, setLink] = useState("")
  
  const verifyLink = () => {
    // Basic validation - check if it's a URL
    if (!link.trim() || !link.match(/^https?:\/\/.+/)) {
      onComplete(false, "Please enter a valid URL")
      return
    }
    
    // Simple success for now - in real implementation, would validate the link
    onComplete(true, `Link verified: ${link}`)
  }
  
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Please provide a link that proves you completed this task.
      </p>
      
      <div className="flex items-center">
        <ExternalLink className="h-5 w-5 text-gray-400 mr-2" />
        <Input
          placeholder="https://example.com/your-proof"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="flex-1"
        />
      </div>
      
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
          onClick={verifyLink}
          disabled={!link.trim()}
        >
          Verify Link
        </Button>
      </div>
    </div>
  )
}

// Location verification component
function LocationVerificationTask({ onComplete, onCancel }: {
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      onComplete(false, "Geolocation is not supported by your browser")
      return
    }
    
    setLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false)
        onComplete(true, `Location verified at: ${position.coords.latitude}, ${position.coords.longitude}`)
      },
      (error) => {
        setLoading(false)
        onComplete(false, `Error getting location: ${error.message}`)
      }
    )
  }
  
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Please verify your current location to complete this task.
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
          onClick={verifyLocation}
          disabled={loading}
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Verify Location
        </Button>
      </div>
    </div>
  )
}

// File upload verification component
function FileUploadTask({ onComplete, onCancel }: {
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [fileComment, setFileComment] = useState("")
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  const uploadFile = async () => {
    if (!file) {
      onComplete(false, "Please select a file to upload")
      return
    }
    
    // In a real implementation, would upload to Supabase storage
    // For now, just simulate success
    onComplete(true, `File "${file.name}" uploaded with comment: ${fileComment}`)
  }
  
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Please upload a document or screenshot that proves you completed this task.
      </p>
      
      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4">
        <label className="flex flex-col items-center cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">
            {file ? file.name : "Click to select file"}
          </span>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/*,application/pdf"
          />
        </label>
      </div>
      
      <Textarea
        placeholder="Add a comment about this file (optional)"
        value={fileComment}
        onChange={(e) => setFileComment(e.target.value)}
        className="h-20"
      />
      
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
          onClick={uploadFile}
          disabled={!file}
        >
          <FileText className="h-4 w-4 mr-2" />
          Submit
        </Button>
      </div>
    </div>
  )
}

// Time-based verification component
function TimeBasedTask({ onComplete, onCancel }: {
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}) {
  const [timeSpent, setTimeSpent] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  
  const startTimer = () => {
    setIsTracking(true)
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)
    setTimerInterval(interval)
  }
  
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    setIsTracking(false)
  }
  
  const completeTimeTask = () => {
    stopTimer()
    onComplete(true, `Time tracked: ${formatTime(timeSpent)}`)
  }
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Track the time you spend on this task.
      </p>
      
      <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50">
        <div className="text-3xl font-mono">{formatTime(timeSpent)}</div>
      </div>
      
      <div className="flex gap-3 mt-2">
        {isTracking ? (
          <>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={stopTimer}
            >
              Pause
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={completeTimeTask}
            >
              Complete
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={startTimer}
            >
              <Timer className="h-4 w-4 mr-2" />
              {timeSpent > 0 ? "Resume" : "Start Tracking"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 